using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoraCoffee.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductVariantsAndOrderOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PriceLarge",
                table: "Products",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SupportsMilkChoice",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MilkType",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SizeLabel",
                table: "OrderItems",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PriceLarge",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SupportsMilkChoice",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MilkType",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "SizeLabel",
                table: "OrderItems");
        }
    }
}
