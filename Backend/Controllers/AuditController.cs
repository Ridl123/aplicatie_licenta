using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Audit
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetAuditLogs()
        {
            // Luăm ultimele 100 de acțiuni, cele mai noi primele
            return await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(100)
                .ToListAsync();
        }

        // POST: api/Audit (Există deja probabil, dar ne asigurăm că e aici)
        [HttpPost]
        public async Task<ActionResult<AuditLog>> PostAuditLog(AuditLog log)
        {
            if (log.Timestamp == default) log.Timestamp = DateTime.UtcNow;
            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
            return Ok(log);
        }
    }
}