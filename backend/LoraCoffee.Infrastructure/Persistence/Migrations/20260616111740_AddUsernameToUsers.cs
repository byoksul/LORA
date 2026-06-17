using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LoraCoffee.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUsernameToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Users"" SET ""Username"" = 'admin' WHERE ""Email"" = 'admin@loracoffee.com';
                UPDATE ""Users"" SET ""Username"" = 'manager' WHERE ""Email"" = 'manager@loracoffee.com';
                UPDATE ""Users"" SET ""Username"" = 'kasiyer' WHERE ""Email"" = 'cashier@loracoffee.com';
                UPDATE ""Users"" SET ""Username"" = 'barista' WHERE ""Email"" = 'barista@loracoffee.com';
                UPDATE ""Users"" SET ""Username"" = split_part(""Email"", '@', 1)
                WHERE ""Username"" IS NULL OR ""Username"" = '';
            ");

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Users");
        }
    }
}
