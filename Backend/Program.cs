using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Backend.Data;
using Backend.Models;
using Backend.Hubs; // Asigură-te că acest namespace este corect

var builder = WebApplication.CreateBuilder(args);

// 1. Conexiunea la Baza de Date
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    //options.UseSqlServer("Server=tcp:bdlicenta.database.windows.net,1433;Initial Catalog=urgencydb;Persist Security Info=False;User ID=adminBD;Password=Rich@rdiulian3;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"));
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
// 2. Configurare Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 3. Configurare JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "Cheie_Secreta_Foarte_Lunga_De_Minim_32_Caractere";
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// --- MODIFICARE SIGNALR ---
builder.Services.AddSignalR();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- MODIFICARE CORS (Esențial pentru SignalR și Vercel) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.SetIsOriginAllowed(origin => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // Necesar pentru SignalR
        });
});

var app = builder.Build();

//if (app.Environment.IsDevelopment()) {
// --- COD MODIFICAT TEMPORAR PENTRU DEPANARE ---
    app.UseDeveloperExceptionPage(); // Asta ne va arăta eroarea exactă pe ecran!
    app.UseSwagger();
    app.UseSwaggerUI();
//}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp"); 

app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

// --- MAPARE HUB SIGNALR ---
app.MapHub<CallHub>("/callHub");

// --- COD NOU PENTRU AZURE: Crearea automată a bazei de date ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate(); // Aplică automat toate migrările (creează tabelele)
    }
    catch (Exception ex)
    {
        Console.WriteLine("Eroare la migrarea bazei de date: " + ex.Message);
    }
}

app.Run();