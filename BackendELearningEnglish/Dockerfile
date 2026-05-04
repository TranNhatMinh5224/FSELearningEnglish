FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY ["LearningEnglish.API/LearningEnglish.API.csproj", "LearningEnglish.API/"]
COPY ["LearningEnglish.Application/LearningEnglish.Application.csproj", "LearningEnglish.Application/"]
COPY ["LearningEnglish.Domain/LearningEnglish.Domain.csproj", "LearningEnglish.Domain/"]
COPY ["LearningEnglish.Infrastructure/LearningEnglish.Infrastructure.csproj", "LearningEnglish.Infrastructure/"]

RUN dotnet restore "LearningEnglish.API/LearningEnglish.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/LearningEnglish.API"
RUN dotnet build "LearningEnglish.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "LearningEnglish.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5030
EXPOSE 5030
ENTRYPOINT ["dotnet", "LearningEnglish.API.dll"]
