using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoraCoffee.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReadyAtToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReadyAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE \"Orders\" SET \"ReadyAt\" = \"UpdatedDate\" WHERE \"Status\" = 2 AND \"ReadyAt\" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReadyAt",
                table: "Orders");
        }
    }
}
