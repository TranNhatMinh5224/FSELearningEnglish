using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LearningEnglish.Application.Interface;
using LearningEnglish.Application.Cofigurations;
using LearningEnglish.Application.Common;
using LearningEnglish.Application.DTOs;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace LearningEnglish.Infrastructure.Services.ExternalProviders.PayOS
{
    public class PayOSService : IPayOSService
    {
        private readonly PayOSOptions _options;
        private readonly ILogger<PayOSService> _logger;
        private readonly HttpClient _httpClient;

        public PayOSService(
            IOptions<PayOSOptions> options,
            ILogger<PayOSService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _options = options.Value;
            _logger = logger;

            if (string.IsNullOrWhiteSpace(_options.ClientId) ||
                string.IsNullOrWhiteSpace(_options.ApiKey) ||
                string.IsNullOrWhiteSpace(_options.ChecksumKey) ||
                string.IsNullOrWhiteSpace(_options.ApiUrl) ||
                string.IsNullOrWhiteSpace(_options.ReturnUrl) ||
                string.IsNullOrWhiteSpace(_options.CancelUrl))
            {
                throw new InvalidOperationException("PayOS configuration is incomplete. Please configure ClientId, ApiKey, ChecksumKey, ApiUrl, ReturnUrl, and CancelUrl.");
            }

            _httpClient = httpClientFactory.CreateClient("PayOS");
            _httpClient.BaseAddress = new Uri(_options.ApiUrl);
            _httpClient.DefaultRequestHeaders.Add("x-client-id", _options.ClientId);
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _options.ApiKey);
        }

        public async Task<ServiceResponse<PayOSLinkResponse>> CreatePaymentLinkAsync(
            CreatePayOSLinkRequest request,
            decimal amount,
            string productName,
            string description,
            long orderCode)
        {
            var response = new ServiceResponse<PayOSLinkResponse>();
            try
            {
                _logger.LogInformation("Creating PayOS payment link for Payment {PaymentId}, OrderCode: {OrderCode}, Amount: {Amount}",
                    request.PaymentId, orderCode, amount);

                if (amount <= 0 || amount > 100000000)
                {
                    _logger.LogError("Invalid amount: {Amount}", amount);
                    response.Success = false;
                    response.Message = "Số tiền không hợp lệ";
                    return response;
                }

                var amountInt = (int)Math.Round(amount, MidpointRounding.AwayFromZero);

                var safeDescription = (description ?? "Thanh toan").Trim();
                // PayOS cho phép description dài hơn; chỉ cắt ở mức an toàn để không bị thiếu nội dung như "Thanh toa"
                const int maxDescriptionLength = 25;
                if (safeDescription.Length > maxDescriptionLength)
                {
                    safeDescription = safeDescription.Substring(0, maxDescriptionLength);
                }

                var baseReturnUrl = _options.ReturnUrl.Trim();
                var baseCancelUrl = _options.CancelUrl.Trim();

                var returnUrl = AppendQueryString(baseReturnUrl, "orderCode", orderCode.ToString());
                var cancelUrl = AppendQueryString(baseCancelUrl, "orderCode", orderCode.ToString());

                var signData = $"amount={amountInt}&cancelUrl={cancelUrl}&description={safeDescription}&orderCode={orderCode}&returnUrl={returnUrl}";
                var signature = HmacSha256(signData, _options.ChecksumKey);

                var requestBody = new
                {
                    orderCode = orderCode,
                    amount = amountInt,
                    description = safeDescription,
                    returnUrl = returnUrl,
                    cancelUrl = cancelUrl,
                    signature = signature
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogInformation("PayOS request body: {Body}", jsonContent);

                var httpResponse = await _httpClient.PostAsync("/v2/payment-requests", content);
                var responseContent = await httpResponse.Content.ReadAsStringAsync();

                _logger.LogInformation("PayOS API response: StatusCode={StatusCode}, Response={Response}",
                    httpResponse.StatusCode, responseContent);

                if (!httpResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("PayOS API error: {StatusCode}, {Response}",
                        httpResponse.StatusCode, responseContent);
                    response.Success = false;
                    response.Message = $"PayOS API error: {responseContent}";
                    return response;
                }

                var payosResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                if (payosResponse.TryGetProperty("code", out var codeElement))
                {
                    var codeStr = codeElement.GetString();
                    if (codeStr != "00")
                    {
                        var descVal = payosResponse.TryGetProperty("desc", out var descElement)
                            ? descElement.GetString()
                            : "Unknown PayOS error";

                        _logger.LogError("PayOS error: Code={Code}, Desc={Desc}, Response={Response}",
                            codeStr, descVal, responseContent);
                        response.Success = false;
                        response.Message = $"PayOS error: {descVal}";
                        return response;
                    }
                }

                if (!payosResponse.TryGetProperty("data", out var dataElement) ||
                    dataElement.ValueKind == JsonValueKind.Null)
                {
                    _logger.LogError("PayOS response missing or null 'data' property. Response: {Response}", responseContent);
                    response.Success = false;
                    response.Message = "PayOS response không hợp lệ: thiếu dữ liệu";
                    return response;
                }

                if (!dataElement.TryGetProperty("checkoutUrl", out var checkoutUrlElement))
                {
                    _logger.LogError("PayOS response missing 'checkoutUrl' property. Response: {Response}", responseContent);
                    response.Success = false;
                    response.Message = "PayOS response không hợp lệ: thiếu checkoutUrl";
                    return response;
                }

                var checkoutUrl = checkoutUrlElement.GetString();

                // Helper to get string property safely (case-insensitive)
                string GetPropString(JsonElement element, string propName)
                {
                    foreach (var prop in element.EnumerateObject())
                    {
                        if (prop.Name.Equals(propName, StringComparison.OrdinalIgnoreCase))
                            return prop.Value.ValueKind == JsonValueKind.String ? prop.Value.GetString() ?? "" : prop.Value.ToString();
                    }
                    return "";
                }

                // Helper to get decimal property safely
                decimal GetPropDecimal(JsonElement element, string propName)
                {
                    foreach (var prop in element.EnumerateObject())
                    {
                        if (prop.Name.Equals(propName, StringComparison.OrdinalIgnoreCase))
                        {
                            if (prop.Value.ValueKind == JsonValueKind.Number) return prop.Value.GetDecimal();
                            if (prop.Value.ValueKind == JsonValueKind.String && decimal.TryParse(prop.Value.GetString(), out var val)) return val;
                        }
                    }
                    return 0;
                }

                // Helper to map BIN to Bank Name
                string GetBankNameByBin(string bin)
                {
                    return bin switch
                    {
                        "970418" => "BIDV",
                        "970436" => "Vietcombank",
                        "970415" => "VietinBank",
                        "970405" => "Agribank",
                        "970422" => "MBBank",
                        "970407" => "Techcombank",
                        "970416" => "ACB",
                        "970432" => "VPBank",
                        "970423" => "TPBank",
                        "970437" => "HDBank",
                        "970441" => "VIB",
                        "970403" => "Sacombank",
                        "970428" => "Nam A Bank",
                        "970429" => "SCB",
                        "970448" => "OCB",
                        "970438" => "BaoViet Bank",
                        "970414" => "OceanBank",
                        "970400" => "SaigonBank",
                        "970412" => "PVcomBank",
                        "970419" => "NCB",
                        "970425" => "ABBANK",
                        "970427" => "VietCapital Bank",
                        "970431" => "Eximbank",
                        "970433" => "VietBank",
                        "970440" => "SeABank",
                        "970443" => "SHB",
                        "970449" => "LienVietPostBank",
                        "970452" => "Kienlongbank",
                        "970454" => "VietABank",
                        "970426" => "MSB",
                        "970439" => "Public Bank Vietnam",
                        "970424" => "Shinhan Bank",
                        "970409" => "Bac A Bank",
                        "970410" => "Standard Chartered",
                        _ => "Ngân hàng liên kết"
                    };
                }

                _logger.LogInformation("Extracting payos details from data: {DataRaw}", dataElement.GetRawText());

                var binValue = GetPropString(dataElement, "bin");

                response.Data = new PayOSLinkResponse
                {
                    CheckoutUrl = checkoutUrl ?? string.Empty,
                    OrderCode = orderCode.ToString(),
                    PaymentId = request.PaymentId,
                    Bin = binValue,
                    AccountNumber = GetPropString(dataElement, "accountNumber"),
                    AccountName = GetPropString(dataElement, "accountName"),
                    Amount = GetPropDecimal(dataElement, "amount"),
                    Description = GetPropString(dataElement, "description"),
                    QrCode = GetPropString(dataElement, "qrCode"),
                    BankName = GetBankNameByBin(binValue)
                };
                response.Success = true;

                _logger.LogInformation("PayOS payment link created successfully: {CheckoutUrl}", checkoutUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayOS payment link");
                response.Success = false;
                response.Message = $"Error: {ex.Message}";
            }

            return response;
        }

        public async Task<ServiceResponse<PayOSWebhookDto>> GetPaymentInformationAsync(long orderCode)
        {
            var response = new ServiceResponse<PayOSWebhookDto>();
            try
            {
                _logger.LogInformation("Getting PayOS payment information for order {OrderCode}", orderCode);

                var httpResponse = await _httpClient.GetAsync($"/v2/payment-requests/{orderCode}");
                var responseContent = await httpResponse.Content.ReadAsStringAsync();

                if (!httpResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("PayOS API error: {StatusCode}, {Response}",
                        httpResponse.StatusCode, responseContent);
                    response.Success = false;
                    response.Message = $"PayOS API error: {responseContent}";
                    return response;
                }

                var payosData = JsonSerializer.Deserialize<JsonElement>(responseContent);
                var code = payosData.GetProperty("code").GetString() ?? "";
                var data = payosData.GetProperty("data");

                var status = data.TryGetProperty("status", out var statusElement)
                    ? statusElement.GetString() ?? ""
                    : "";

                response.Data = new PayOSWebhookDto
                {
                    Code = code,
                    OrderCode = data.GetProperty("orderCode").GetInt64(),
                    Desc = payosData.TryGetProperty("desc", out var desc) ? desc.GetString() ?? "" : "",
                    Data = responseContent,
                    Signature = "",
                    Status = status
                };
                response.Success = true;

                _logger.LogInformation("PayOS payment information retrieved: Code={Code}, OrderCode={OrderCode}, Status={Status}",
                    code, orderCode, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting PayOS payment information");
                response.Success = false;
                response.Message = ex.Message;
            }

            return response;
        }

        private string HmacSha256(string data, string key)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);

            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(dataBytes);
            return Convert.ToHexString(hashBytes).ToLower();
        }

        private static string AppendQueryString(string baseUrl, string key, string value)
        {
            var separator = baseUrl.Contains("?") ? "&" : "?";
            return $"{baseUrl}{separator}{Uri.EscapeDataString(key)}={Uri.EscapeDataString(value)}";
        }

        public Task<bool> VerifyWebhookSignature(string data, string signature)
        {
            try
            {
                var computedSignature = HmacSha256(data, _options.ChecksumKey);
                var isValid = computedSignature == (signature ?? string.Empty).ToLowerInvariant();

                if (!isValid)
                {
                    _logger.LogWarning("Invalid PayOS webhook signature. Expected: {Expected}, Received: {Received}",
                        computedSignature, signature);
                }

                return Task.FromResult(isValid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying PayOS webhook signature");
                return Task.FromResult(false);
            }
        }
    }
}
