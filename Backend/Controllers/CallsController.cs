using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CallsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CallsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Calls (Ia toate apelurile din Azure)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Call>>> GetCalls()
        {
            // Ordonăm după dată descrescător ca să apară cele mai noi primele
            return await _context.Calls
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        // POST: api/Calls (Adaugă un apel nou în Azure)
        [HttpPost]
        public async Task<ActionResult<Call>> PostCall(Call call)
        {
            // Ne asigurăm că are o dată de creare dacă nu vine de la frontend
            if (call.CreatedAt == default) call.CreatedAt = DateTime.UtcNow;
            
            _context.Calls.Add(call);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCalls), new { id = call.Id }, call);
        }

        // PATCH: api/Calls/{id} (Actualizează statusul apelului - ESENȚIAL PENTRU BUTONUL PREIA)
        [HttpPatch("{id}")]
        public async Task<IActionResult> PatchCallStatus(Guid id, [FromBody] CallUpdateDto update)
        {
            var call = await _context.Calls.FindAsync(id);
            
            if (call == null)
            {
                return NotFound();
            }

            // Actualizăm doar statusul
            if (!string.IsNullOrEmpty(update.Status))
            {
                call.Status = update.Status;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CallExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        private bool CallExists(Guid id)
        {
            return _context.Calls.Any(e => e.Id == id);
        }
    }

    // Clasă DTO (Data Transfer Object) pentru a primi doar statusul de la Frontend
    public class CallUpdateDto
    {
        public string Status { get; set; } = string.Empty;
    }
}