using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningEnglish.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAudioToQuizGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AudioKey",
                table: "QuizGroups",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AudioType",
                table: "QuizGroups",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$YDhCVJzlwHqdyp9Qi85R9ej2lOrgbql5lFw21OdfsIqyGAeZRzhsS");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AudioKey",
                table: "QuizGroups");

            migrationBuilder.DropColumn(
                name: "AudioType",
                table: "QuizGroups");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$xw2NXGP2KgsDJjdcN4LGOeqPwrTRDOTrK2Ydtos9MvpB/Bnn/XrC.");
        }
    }
}
