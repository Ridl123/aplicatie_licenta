namespace Backend.Models
{
    public class Unit
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // ex: B-01-AMB
        public string Type { get; set; } = string.Empty; // Ambulanta, Politie, Pompieri
        public bool IsAvailable { get; set; } = true;
        
        // Relația Many-to-Many cu Intervențiile
        public ICollection<InterventionUnit> InterventionUnits { get; set; } = new List<InterventionUnit>();
    }
}