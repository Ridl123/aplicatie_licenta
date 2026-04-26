using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Bogus;
using Microsoft.AspNetCore.SignalR;
using Backend.Hubs;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CallsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<CallHub> _hubContext; // Injectăm Hub-ul

        public CallsController(ApplicationDbContext context, IHubContext<CallHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Call>>> GetCalls()
        {
            return await _context.Calls
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Call>> PostCall(Call call)
        {
            if (call.CreatedAt == default) call.CreatedAt = DateTime.UtcNow;
            
            _context.Calls.Add(call);
            await _context.SaveChangesAsync();

            // NOTIFICARE SIGNALR: Apel nou
            await _hubContext.Clients.All.SendAsync("UpdateCalls");

            return CreatedAtAction(nameof(GetCalls), new { id = call.Id }, call);
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> PatchCallStatus(Guid id, [FromBody] CallUpdateDto update)
        {
            var call = await _context.Calls.FindAsync(id);
            if (call == null) return NotFound();

            if (!string.IsNullOrEmpty(update.Status))
            {
                call.Status = update.Status;
            }

            try
            {
                await _context.SaveChangesAsync();
                
                // NOTIFICARE SIGNALR: Status schimbat (Preluare apel)
                await _hubContext.Clients.All.SendAsync("UpdateCalls");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CallExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpPost("generate-test-data")]
        public async Task<IActionResult> GenerateTestData()
        {
            if (_context.Calls.Any())
            {
                return BadRequest(new { Message = "Baza de date conține deja apeluri." });
            }

            var callFaker = new Faker<Call>()
                .RuleFor(c => c.Id, f => Guid.NewGuid())
                .RuleFor(c => c.CallerNumber, f => f.Phone.PhoneNumber("07########"))
                .RuleFor(c => c.EmergencyType, f => f.PickRandom(new[] { "FIRE", "MEDICAL", "POLICE" }))
                .RuleFor(c => c.Latitude, f => f.Random.Double(44.35, 44.55)) 
                .RuleFor(c => c.Longitude, f => f.Random.Double(25.95, 26.25))
                .RuleFor(c => c.Description, (f, c) => 
                {
                    if (c.EmergencyType == "FIRE")
                        return f.PickRandom(new[] { 
                            "Incendiu la etajul 3 al unui bloc rezidențial. Fum dens pe casa scării.", 
                            "Accident rutier grav, mașina a luat foc. Posibil victime blocate înăuntru.", 
                            "Vegetație uscată aprinsă lângă o benzinărie." 
                        });
                    if (c.EmergencyType == "MEDICAL")
                        return f.PickRandom(new[] { 
                            "Persoană inconștientă căzută pe stradă.", 
                            "Suspect infarct: dureri severe în piept.", 
                            "Accident de muncă: cădere de la înălțime." 
                        });
                    return f.PickRandom(new[] { 
                        "Conflict spontan cu bâte.", 
                        "Tentativă de jaf la farmacie.", 
                        "Șofer beat pe contrasens." 
                    });
                })
                .RuleFor(c => c.Status, f => "PENDING") 
                .RuleFor(c => c.CreatedAt, f => f.Date.Recent(1)); 

            var fakeCalls = callFaker.Generate(30);

            await _context.Calls.AddRangeAsync(fakeCalls);
            await _context.SaveChangesAsync();

            // NOTIFICARE SIGNALR: Date noi generate
            await _hubContext.Clients.All.SendAsync("UpdateCalls");

            return Ok(new { Message = $"Au fost generate cu succes {fakeCalls.Count} apeluri!" });
        }

        [HttpPost("{id}/close")]
        public async Task<IActionResult> CloseCall(Guid id)
        {
            var call = await _context.Calls.FindAsync(id);
            if (call == null) return NotFound(new { Message = "Apelul nu a fost găsit." });

            call.Status = "CLOSED";

            var intervention = await _context.Interventions
                .Include(i => i.InterventionUnits)
                .FirstOrDefaultAsync(i => i.CallId == id);

            if (intervention != null)
            {
                intervention.Status = "COMPLETED";
                foreach (var interventionUnit in intervention.InterventionUnits)
                {
                    var unit = await _context.Units.FindAsync(interventionUnit.UnitId);
                    if (unit != null) unit.IsAvailable = true; 
                }
            }

            await _context.SaveChangesAsync();

            // NOTIFICARE SIGNALR: Caz închis (Eliberează și apelul și unitățile)
            await _hubContext.Clients.All.SendAsync("UpdateCalls");

            return Ok(new { Message = "Cazul a fost închis!" });
        }

        private bool CallExists(Guid id)
        {
            return _context.Calls.Any(e => e.Id == id);
        }
    }
    
    public class CallUpdateDto
    {
        public string Status { get; set; } = string.Empty;
    }
}