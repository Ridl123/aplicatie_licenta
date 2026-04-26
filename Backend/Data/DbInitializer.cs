using Backend.Models;
using Bogus;

namespace Backend.Data
{
    public static class DbInitializer
    {
        public static void Seed(ApplicationDbContext context)
        {
            if (context.Units.Any()) return; // Daca avem date, nu mai adaugam

            // Generare Unitati
            var units = new List<Unit> {
                new Unit { Name = "AMB-01", Type = "Ambulanta" },
                new Unit { Name = "AMB-02", Type = "Ambulanta" },
                new Unit { Name = "POMP-01", Type = "Pompieri" },
                new Unit { Name = "POL-01", Type = "Politie" }
            };
            context.Units.AddRange(units);

            // Generare Apeluri Fictive cu Bogus
            // Generare Apeluri Fictive cu Bogus
            var callFaker = new Faker<Call>()
                // Corectat: Modelul are CallerNumber, nu CallerName sau PhoneNumber
                .RuleFor(c => c.CallerNumber, f => f.Phone.PhoneNumber("07########")) 
                
                // Corectat: Modelul are Description, nu un camp de nume (poti pune un motiv de urgenta)
                .RuleFor(c => c.Description, f => f.Lorem.Sentence()) 
                
                .RuleFor(c => c.Latitude, f => f.Address.Latitude(44.4, 44.5))
                .RuleFor(c => c.Longitude, f => f.Address.Longitude(26.0, 26.1))
                
                // Corectat: Modelul are CreatedAt, nu ReceivedAt
                .RuleFor(c => c.CreatedAt, f => f.Date.Recent())
                
                // Optional: Adauga reguli si pentru restul campurilor obligatorii din model
                .RuleFor(c => c.EmergencyType, f => f.PickRandom(new[] { "Medical", "Fire", "Police" }))
                .RuleFor(c => c.Status, f => "Pending");

            var calls = callFaker.Generate(10);
            context.Calls.AddRange(calls);
            
            context.SaveChanges();
        }
    }
}