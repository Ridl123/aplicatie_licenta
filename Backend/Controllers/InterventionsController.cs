using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.SignalR; // Import nou
using Backend.Hubs; // Import nou

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InterventionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<CallHub> _hubContext; // Injectăm Hub-ul

        public InterventionsController(ApplicationDbContext context, IHubContext<CallHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost]
        public async Task<IActionResult> CreateIntervention([FromBody] CreateInterventionDto request)
        {
            var call = await _context.Calls.FindAsync(request.CallId);
            if (call == null)
            {
                return NotFound(new { Message = "Apelul nu a fost găsit în sistem." });
            }

            var intervention = new Intervention
            {
                CallId = request.CallId,
                Status = "DISPATCHED" 
            };

            _context.Interventions.Add(intervention);
            await _context.SaveChangesAsync();

            foreach (var unitId in request.UnitIds)
            {
                var interventionUnit = new InterventionUnit
                {
                    InterventionId = intervention.Id,
                    UnitId = unitId
                };
                _context.InterventionUnits.Add(interventionUnit);

                var unit = await _context.Units.FindAsync(unitId);
                if (unit != null)
                {
                    unit.IsAvailable = false;
                }
            }

            call.Status = "ACTIVE";

            await _context.SaveChangesAsync();

            // NOTIFICARE SIGNALR: S-au ocupat mașini și s-a schimbat statusul apelului
            await _hubContext.Clients.All.SendAsync("UpdateCalls");

            return Ok(new { Message = "Intervenția a fost salvată cu succes!", InterventionId = intervention.Id });
        }
    }

    public class CreateInterventionDto
    {
        public Guid CallId { get; set; }
        public List<int> UnitIds { get; set; } = new List<int>();
    }
}