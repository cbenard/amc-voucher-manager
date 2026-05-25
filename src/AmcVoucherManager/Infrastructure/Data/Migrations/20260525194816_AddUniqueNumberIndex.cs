using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmcVoucherManager.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueNumberIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Vouchers_Number12_Number16",
                table: "Vouchers",
                columns: new[] { "Number12", "Number16" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vouchers_Number12_Number16",
                table: "Vouchers");
        }
    }
}
