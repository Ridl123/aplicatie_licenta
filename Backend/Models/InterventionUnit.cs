namespace Backend.Models
{
    public class InterventionUnit
    {
        public int InterventionId { get; set; }
        public Intervention Intervention { get; set; } = null!;

        public int UnitId { get; set; }
        public Unit Unit { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}