using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;  
using Backend.Models;

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
        return await _context.AuditLogs.OrderByDescending(x => x.Timestamp).ToListAsync();
    }

    // POST: api/Audit
    [HttpPost]
    public async Task<ActionResult<AuditLog>> PostAuditLog(AuditLog auditLog)
    {
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
        return Ok(auditLog);
    }
}