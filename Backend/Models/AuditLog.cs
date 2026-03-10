using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }
        public string OperatorId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}