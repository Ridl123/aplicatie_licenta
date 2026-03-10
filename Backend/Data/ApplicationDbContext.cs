using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Call> Calls { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        // Aici adăug ulterior și tabelele pentru InterventionUnits și AuditLogs
    }
}