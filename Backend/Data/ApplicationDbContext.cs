using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Call> Calls { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<Intervention> Interventions { get; set; }
        public DbSet<InterventionUnit> InterventionUnits { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configurare cheie compusă pentru Many-to-Many
            builder.Entity<InterventionUnit>()
                .HasKey(iu => new { iu.InterventionId, iu.UnitId });

            builder.Entity<InterventionUnit>()
                .HasOne(iu => iu.Intervention)
                .WithMany(i => i.InterventionUnits)
                .HasForeignKey(iu => iu.InterventionId);

            builder.Entity<InterventionUnit>()
                .HasOne(iu => iu.Unit)
                .WithMany(u => u.InterventionUnits)
                .HasForeignKey(iu => iu.UnitId);
        }
    }
}