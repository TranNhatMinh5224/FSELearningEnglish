using System;
using Microsoft.Data.SqlClient;
using Npgsql;

var connectionString = "Host=localhost;Port=5432;Database=elearningenglish;Username=postgres;Password=05022004";

try {
    using var conn = new NpgsqlConnection(connectionString);
    conn.Open();
    using var cmd = new NpgsqlCommand("SELECT \"QuizId\", \"Title\", \"TotalPossibleScore\" FROM \"Quizzes\" ORDER BY \"QuizId\" DESC LIMIT 5;", conn);
    using var reader = cmd.ExecuteReader();
    Console.WriteLine("QuizId | Title | TotalPossibleScore");
    Console.WriteLine("-------|-------|-------------------");
    while (reader.Read()) {
        Console.WriteLine($"{reader[0]} | {reader[1]} | {reader[2]}");
    }
} catch (Exception ex) {
    Console.WriteLine($"Error: {ex.Message}");
}
