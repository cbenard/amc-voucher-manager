using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmcVoucherManager.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Vouchers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Number12 = table.Column<string>(type: "TEXT", maxLength: 12, nullable: false),
                    Number16 = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    DateAdded = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    IsArchived = table.Column<bool>(type: "INTEGER", nullable: false),
                    ArchivedDate = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vouchers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_DateAdded",
                table: "Vouchers",
                column: "DateAdded");

            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_IsArchived",
                table: "Vouchers",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_Type",
                table: "Vouchers",
                column: "Type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Vouchers");
        }
    }
}
