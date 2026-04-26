namespace Backend.Models
{
    public class Intervention
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public string Status { get; set; } = "Active"; // Active, Resolved, Cancelled

        // Legătura cu Apelul inițial
        public Guid CallId { get; set; }
        public Call Call { get; set; } = null!;

        // Echipajele alocate
        public ICollection<InterventionUnit> InterventionUnits { get; set; } = new List<InterventionUnit>();
    }
}