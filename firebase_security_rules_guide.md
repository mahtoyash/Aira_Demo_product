# Firebase Security & Deployment Guide 🔒

## Kya Firebase API Key ko chupaana chahiye? (Hide `firebase.ts`?)
Nahi! React aur Vite jaisi frontend websites mein Firebase config (API Keys, Project IDs) **intentionally public hi hoti hain**. Agar aap in files ko delete ya `.gitignore` kar denge, toh jab aapki site GitHub Pages par live jayegi, usse database connect karna nahi aayega aur site turant crash ho jayegi. API Keys ko GitHub par push hone dein, yeh perfectly safe hai! Real security "Firebase Rules" se handle hoti hai.

## Toh Firebase Secure Kaise Karein? (Security Rules)
Abhi agar aapka database public hai (`.read: true`, `.write: true`), toh koi bhi user us link ko kharid kar aapke server mein junk data upload kar sakta hai.
Ise fix karne ka standard rule hai:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
Iska matlab hai *sirf* wo log jo Dashboard mein Google Gmail se login karenge, wahi data padh ya likh payenge. 

## ⚠️ DHYAN DEIN (Site Down Kyun Ho Sakti Hai!)
Aapka hardware (Arduino ESP32) apne `co2_monitor_esp32.ino` code mein sidha `readings.json` URL call karta hai **BINAA KISI PASSWORD KE**. 
Agar aapne upar wali security rules (auth != null) laga di, toh Google Firebase aapke ESP32 ko turant **block kar dega** aur uski CO2 readings upload hona band ho jayegi! Site chalegi, par aana band ho jayega.

### Solution: ESP32 ko block hone se kaise bachayein?
Aapko database rules mein ek chota backdoor ya Firebase "Database Secret" use karna padega hardware ke liye.

**Option 1: Arduino Code Change (Best Practice - Database Secret)**
Aapne jo URL ESP32 mein di hai usme ek "auth" token lagana padega:
1. Firebase Console > Project Settings > Service Accounts > Database Secrets mein jaayein. 
2. Ek naya secret (e.g. `xyz123...`) copy karein.
3. Apne ESP32 Code mein URL change kardein:
```cpp
// Purana code:
const char* apiURL = "https://co2-monitor-effff-default-rtdb.asia-southeast1.firebasedatabase.app/readings.json";

// Naya code (auth secret lagakar):
const char* apiURL = "https://co2-monitor-effff-default-rtdb.asia-southeast1.firebasedatabase.app/readings.json?auth=xyz123...";
```
Aisa karne par jab aap rule `.write: "auth != null"` karenge, toh wo automatically kaam karta rahega kyunki ESP32 ke paas backend bypass token hoga!

**Option 2: Custom Rules for Readings**
Agar hardware ka code update nahi karna chahte, toh Firebase rules main specifically readings route par public write enable kariye, par har jagah band rakhiye:
```json
{
  "rules": {
    // Sirf logged in Web Dashboard users dusri settings access karenge
    ".read": "auth != null",
    ".write": "auth != null",
    "readings": {
      // Arduino freely readings de sakta hai, par publically koi aur cheez touch nahi hogi
       ".write": true,
       ".read": "auth != null"
    },
    // Same for rooms logic
    "rooms": {
      ".write": true
    }
  }
}
```
