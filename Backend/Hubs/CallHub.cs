using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs
{
    // Această clasă gestionează conexiunile WebSocket
    public class CallHub : Hub
    {
        // Putem adăuga metode aici dacă vrem ca Frontend-ul să trimită mesaje, 
        // dar pentru început o vom folosi doar pentru a trimite de la server la clienți.
    }
}