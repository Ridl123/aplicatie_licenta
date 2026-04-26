using Microsoft.AspNetCore.Identity;

namespace Backend.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        
        // Audit Logs create de acest utilizator
        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }
}