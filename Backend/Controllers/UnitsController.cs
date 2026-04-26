using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UnitsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UnitsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // --- ENDPOINT GENERARE ECHIPAJE ---
        [HttpPost("generate-test-data")]
        public async Task<IActionResult> GenerateTestUnits()
        {
            // Verificăm dacă avem deja echipaje ca să nu le duplicăm
            if (_context.Units.Any())
            {
                return BadRequest(new { Message = "Există deja echipaje în baza de date!" });
            }

            var units = new List<Unit>
            {
                // Ambulanțe (MEDICAL)
                new Unit { Name = "SMURD B-01", Type = "MEDICAL", IsAvailable = true },
                new Unit { Name = "SMURD B-05", Type = "MEDICAL", IsAvailable = true },
                new Unit { Name = "AMB B-12", Type = "MEDICAL", IsAvailable = true },
                new Unit { Name = "AMB IF-03", Type = "MEDICAL", IsAvailable = true },
                new Unit { Name = "AMB B-44", Type = "MEDICAL", IsAvailable = true },

                // Pompieri (FIRE)
                new Unit { Name = "ISU B-ASAS-01", Type = "FIRE", IsAvailable = true },
                new Unit { Name = "ISU B-ASAS-04", Type = "FIRE", IsAvailable = true },
                new Unit { Name = "ISU IF-AUTOSCARA", Type = "FIRE", IsAvailable = true },
                new Unit { Name = "ISU B-DESCARCERARE", Type = "FIRE", IsAvailable = true },

                // Poliție (POLICE)
                new Unit { Name = "POL B-01", Type = "POLICE", IsAvailable = true },
                new Unit { Name = "POL B-15", Type = "POLICE", IsAvailable = true },
                new Unit { Name = "POL RUTIERA-02", Type = "POLICE", IsAvailable = true },
                new Unit { Name = "JANDARMERIA B-01", Type = "POLICE", IsAvailable = true },
                new Unit { Name = "POL IF-09", Type = "POLICE", IsAvailable = true }
            };

            await _context.Units.AddRangeAsync(units);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Au fost generate cu succes {units.Count} echipaje!" });
        }

        // --- ENDPOINT PENTRU A ADUCE TOATE ECHIPAJELE PE FRONTEND ---
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Unit>>> GetUnits()
        {
            return await _context.Units.ToListAsync();
        }
    }
}