using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningEnglish.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetFrontendFull : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Feedback",
                table: "EssaySubmissions");

            migrationBuilder.DropColumn(
                name: "GradedAt",
                table: "EssaySubmissions");

            migrationBuilder.DropColumn(
                name: "Score",
                table: "EssaySubmissions");

            migrationBuilder.AlterColumn<string>(
                name: "NameImage",
                table: "AssetsFrontend",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "KeyImage",
                table: "AssetsFrontend",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ImageType",
                table: "AssetsFrontend",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$a2pN3OTT67VJ6qwsLTihfuA8z6f5snCw0joi267yeNT1A7wTrP8im");

            migrationBuilder.CreateIndex(
                name: "IX_AssetsFrontend_AssetType",
                table: "AssetsFrontend",
                column: "AssetType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AssetsFrontend_AssetType",
                table: "AssetsFrontend");

            migrationBuilder.DropColumn(
                name: "ImageType",
                table: "AssetsFrontend");

            migrationBuilder.AddColumn<string>(
                name: "Feedback",
                table: "EssaySubmissions",
                type: "character varying(5000)",
                maxLength: 5000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GradedAt",
                table: "EssaySubmissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Score",
                table: "EssaySubmissions",
                type: "numeric",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NameImage",
                table: "AssetsFrontend",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "KeyImage",
                table: "AssetsFrontend",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$sTw7bN6x3Oskv5UTytFz9OhOctDAZkSmcqfJl2hCsqiecvMNgpkB.");
        }
    }
}
