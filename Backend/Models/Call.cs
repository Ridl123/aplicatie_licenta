using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Call
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public string CallerNumber { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string EmergencyType { get; set; } = "Unknown"; // Medical, Fire, Police
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}