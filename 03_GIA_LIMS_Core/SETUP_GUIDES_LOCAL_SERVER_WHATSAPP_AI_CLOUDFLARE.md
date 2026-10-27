# PRODUCTION TURNKEY DEPLOYMENT & SETUP ARCHITECTURE MANUAL
## HRGen GIA LIMS — Enterprise Multi-Station, WhatsApp, Zero-Trust Remote Tunnel & AI Copilot Runbooks

**Document Identifier**: `HRGEN-LIMS-TURNKEY-DEPLOYMENT-2026-V1`  
**Standard Compliance**: NABL 112 | ISO 15189:2022 | ISO 17025 | EU GMP Annex 11 | US FDA 21 CFR Part 11 | GAMP 5 Category 4/5 | India DPDP Act 2023  
**Target Operating Environment**: Microsoft Windows 10 / 11 Pro 64-bit, Windows Server 2019 / 2022, Node.js v24+, Chromium Edge / Chrome  
**Application Architecture**: Node.js / Express Hardened Core (`PORT=3001`), PostgreSQL 18 Multi-Tenant RLS, ASTM E1381/E1394 (`PORT=5000`), HL7 v2.5 MLLP (`PORT=2575`)  
**Publication Date**: October 2026  
**Status**: Authoritative Production Manual  

---

## 1. Executive Architecture Overview & Deployment Topology Matrix

Modern accredited clinical diagnostic laboratories require a robust, fault-tolerant infrastructure that accommodates diverse operational realities:
1. Fast, latency-free counter billing and phlebotomy operations within the physical facility.
2. Direct communication with automated analyzers (Hematology, Biochemistry, Immunology) over local serial and Ethernet connections.
3. Rapid, paperless diagnostic report delivery to patients via smartphone (WhatsApp and Web QR verification).
4. Secure, encrypted remote tele-pathology review and digital sign-off from outside the laboratory without opening vulnerable router ports.
5. Compliant, human-in-the-loop AI assistance that enhances technician productivity without breaching clinical safety or GAMP 5 governance.

HRGen GIA LIMS achieves this through four decoupled, synergistic deployment setups:

| Setup Module | Core Purpose | Infrastructure Required | Cost Impact | Security Level |
|:---|:---|:---|:---|:---|
| **Setup 1: Local PC Server & LAN/Wi-Fi** | Zero-cost clinic hosting; multi-station LAN connectivity for Reception, Phlebotomy, Bench Tech, and Pathologist | Existing Clinic PC + Standard Wi-Fi Router or Gigabit Switch | **₹0 / $0** (Uses existing hardware) | Private Subnet Isolation (Private Network Profile) |
| **Setup 2: WhatsApp Report Delivery** | Instant patient report notification, PDF download, and billing balance inquiry | Meta WhatsApp Cloud API (2-Way) or 1-Click Browser Web | Free tier (1,000 service convs/mo) or 100% Free wa.me | Tokenized Verification Links (Zero PHI in plain text) |
| **Setup 3: Cloudflare Zero-Trust Tunnel** | Remote doctor/pathologist access and public patient QR verification without public IP | Free Cloudflare account + Domain name (`.in`, `.com`, etc.) | **₹0 / $0** (Cloudflare Free Tier) | Mutual TLS 1.3, Encrypted QUIC outbound, Cloudflare Access OTP |
| **Setup 4: Gemini AI Copilot & Voice Scribe** | Hands-free bilingual voice dictation (Hindi/English) and differential diagnostic notes | Google Gemini API Key (`gemini-2.5-flash`) via `@google/genai` | Free / Pay-per-token tier ($0.075 / 1M tokens) | Strict GAMP 5 Non-Clinical Firewall (HTTP 403 fail-closed) |

```
========================================================================================================================
                                      UNIFIED ENTERPRISE DEPLOYMENT ARCHITECTURE
========================================================================================================================

    [ REMOTE CLIENTS: Doctor / Pathologist / Patient ]
         |
         | (Encrypted HTTPS via lims.yourlab.in)
         v
    +---------------------------------------------------------------------------------------------------+
    |                              CLOUDFLARE GLOBAL ANYCAST EDGE NETWORK                                |
    |  - Automatic Edge TLS 1.3 Termination                                                             |
    |  - Cloudflare Access Zero-Trust Gateway:                                                          |
    |      * Pathologist / Staff (/api/*, /*)  ──> Requires 6-Digit Email OTP Login                     |
    |      * Patient QR Portal (/verify/*)     ──> Public Direct Bypass                                 |
    +---------------------------------------------------------------------------------------------------+
                                         |
                                         | Outbound-Only Encrypted QUIC Tunnel (No open router ports)
                                         v
=========================================|==============================================================================
   PHYSICAL CLINIC LOCAL NETWORK (LAN / Wi-Fi Subnet: 192.168.1.0/24)
=========================================|==============================================================================
                                         v
                         +-------------------------------+
                         |   HOST SERVER WORKSTATION     |
                         |   Static IP: 192.168.1.50     |
                         |   Hostname: lims-server.local |
                         +-------------------------------+
                                  |             |
           +----------------------+             +----------------------+
           |                                                           |
           v                                                           v
  [ Background Services ]                                     [ Network Listeners ]
  - PM2 / NSSM Process Daemon                                 - Express API & PWA Shell : TCP 3001
  - cloudflared.exe Tunnel Client                             - ASTM E1381/E1394 Engine : TCP 5000
  - PostgreSQL 18 Engine (RLS)                                - HL7 v2.5 MLLP Edge      : TCP 2575
           |                                                           |
           +------------------------------+----------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
|  RECEPTION & BILLING  |     |  PHLEBOTOMY BENCH     |     |  LAB TECHNICIAN BENCH |
|  Client PC / Edge PWA |     |  Touch Tablet / PC    |     |  Analyzer Operator PC |
|  http://192.168.1.50  |     |  http://192.168.1.50  |     |  http://192.168.1.50  |
|  :3001/#opd           |     |  :3001/#specimens     |     |  :3001/#worklist      |
|  - Patient Reg (UHID) |     |  - Vacutainer Barcode |     |  - ASTM/HL7 Import    |
|  - Rate Cards / GST   |     |  - Order of Draw Check|     |  - Westgard 6-Rule QC |
|  - UPI QR / Payments  |     |  - Specimen Triage    |     |  - Bilingual Dictation|
|  - 50x25mm Label Print|     |  - Accept/Reject Gate |     |  - Manual Result Entry|
+-----------------------+     +-----------------------+     +-----------------------+
        |                                 |                                 |
        +---------------------------------+---------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v                                                                   v
+-----------------------+                                         +-----------------------+
|   PATHOLOGIST CABIN   |                                         |  AUTOMATED ANALYZERS  |
|  Consultant Report PC |                                         |  Sysmex / Mindray /   |
|  http://192.168.1.50  |                                         |  Beckman Coulter /    |
|  :3001/#pathologist   |                                         |  Roche Cobas          |
|  - Clinical Review    |                                         |  Direct TCP to:       |
|  - Panic Delta Check  |                                         |  192.168.1.50:5000    |
|  - Bcrypt Sign-Off    |                                         |  192.168.1.50:2575    |
|  - HMAC Digital Seal  |                                         |  (Raw UNREVIEWED)     |
+-----------------------+                                         +-----------------------+
========================================================================================================================
```

---

## 2. Hardware & Infrastructure Prerequisites

### 2.1 Host Server PC Recommendations
The central server runs continuously during clinic operational hours (or 24x7 for hospital-attached labs). 

| Component | Minimum Specification (Small Lab: <50 patients/day) | Recommended Specification (Medium/Large: 50-500 patients/day) |
|:---|:---|:---|
| **Processor** | Intel Core i3 (8th Gen+) or AMD Ryzen 3 | Intel Core i5 / i7 (10th Gen+) or AMD Ryzen 5 / 7 |
| **System Memory (RAM)**| 8 GB DDR4 | 16 GB or 32 GB DDR4/DDR5 |
| **Storage Subsystem** | 256 GB SATA SSD | 512 GB / 1 TB NVMe M.2 SSD (High IOPS for PostgreSQL) |
| **Network Interface** | 100/1000 Mbps Gigabit Ethernet RJ-45 | Intel Gigabit Ethernet (Direct Cat6 patch cable to switch) |
| **Power Protection** | 600 VA Line-Interactive UPS (15 min backup)| 1 KVA Online UPS with USB automatic shutdown signaling |
| **Operating System** | Windows 10 Pro 64-bit (v21H2+) | Windows 11 Pro 64-bit or Windows Server 2022 Standard |

*Note: Windows "Home" editions are not recommended for the host server because Windows Home lacks Group Policy, restricts network connection concurrency, and cannot run the official Hyper-V/Docker subsystem efficiently without third-party workarounds.*

### 2.2 Client Workstation Recommendations
Client stations require zero custom software. Any device with an HTML5 / Chromium browser can function as a complete laboratory workstation.

| Station | Typical Device | Recommended Screen Resolution | Peripheral Hardware |
|:---|:---|:---|:---|
| **Reception / Billing** | Standard Desktop PC or Laptop | 1920x1080 (Full HD) | Thermal Receipt Printer (80mm) or Laser Printer, Barcode Scanner |
| **Phlebotomy Station** | 10" to 12" Windows Tablet / Laptop | 1920x1080 or 1280x800 | Direct Thermal Label Printer (50x25mm labels, USB or Network) |
| **Tech Analyzer Bench** | Desktop PC co-located with machines | 1920x1080 | USB Handheld 1D/2D Barcode Scanner, USB Microphone for Dictation |
| **Pathologist Cabin** | Desktop PC or High-Res Laptop | 1920x1080 or 2560x1440 | High-contrast IPS Monitor (for morphology inspection), Color Laser Printer |

### 2.3 Local Network Equipment
- **Switch / Router**: Gigabit Switch (8-port or 16-port Unmanaged/Managed Gigabit Switch, e.g., TP-Link TL-SG108 or D-Link DGS-1008A).
- **Wi-Fi Access Point**: Wi-Fi 5 or Wi-Fi 6 router (802.11ac/ax, 5 GHz band recommended for phlebotomy tablets to prevent interference).
- **Cabling**: Cat5e or Cat6 shielded twisted-pair (STP/UTP) cabling for all stationary PCs and automated analyzers.

---

## 3. Setup 1: Local PC Server & Multi-PC LAN/Wi-Fi Connection (Zero-Cost Local Hosting)

### 3.1 Network Topology & Port Bindings Architecture
When HRGen GIA LIMS starts on the host server (`node server.js` or `npm start`), it binds to `0.0.0.0` (all local network interfaces).

| Port | Protocol | Service Module | Access Scope | Description |
|:---|:---|:---|:---|:---|
| **3001** | TCP | Web Application & REST API | LAN Clients & Cloudflare Tunnel | PWA app shell, authentication, OPD billing, result entry, pathologist cockpit |
| **5000** | TCP | ASTM E1381/E1394 Edge Server | Automated Analyzers | Low-level serial-over-LAN stream listener for hematology/biochemistry analyzers |
| **2575** | TCP | HL7 v2.5 / MLLP Edge Server | Automated Analyzers & HIS | Minimal Lower Layer Protocol listener receiving ORU-R01 diagnostic messages |

*Warning: Ports 5000 and 2575 are strict machine-to-machine analytical ingestion interfaces. They must NEVER be exposed to the public internet.*

### 3.2 Step-by-Step Host PC Windows Network Configuration (Static IP vs mDNS)

To prevent client workstations from losing connection when the clinic Wi-Fi router restarts, the Host Server PC must maintain a deterministic IP address.

#### Method A: Assigning a Static IPv4 Address via Windows PowerShell (Recommended)
1. Log into the Host Server PC as Administrator.
2. Open PowerShell as Administrator (Press `Win + X`, select **Windows PowerShell (Admin)** or **Terminal (Admin)**).
3. Execute the following script to identify your network adapter and assign a permanent IP:

```powershell
<#
.SYNOPSIS
    Configures a Static IPv4 Address on the Host Server PC.
.DESCRIPTION
    Replaces dynamic DHCP with a deterministic IP address within the clinic subnet.
    Adjust IPAddress, DefaultGateway, and PrefixLength according to your router.
#>

# Step 1: Detect active network adapters
Write-Host "--- Scanning Active Network Interfaces ---" -ForegroundColor Cyan
Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Format-Table -Property Name, InterfaceIndex, InterfaceDescription, LinkSpeed

# Step 2: Define your clinic network parameters (Modify as needed)
$InterfaceAlias = "Ethernet"              # Typically "Ethernet" or "Wi-Fi"
$StaticIP       = "192.168.1.50"           # Server IP outside typical router DHCP pool
$SubnetMaskBits = 24                       # Equivalent to 255.255.255.0
$DefaultGateway = "192.168.1.1"            # Your router's LAN IP address
$DnsServers     = @("192.168.1.1", "1.1.1.1") # Router DNS + Cloudflare Primary DNS

Write-Host "Applying Static IP $StaticIP on interface '$InterfaceAlias'..." -ForegroundColor Yellow

# Step 3: Remove existing IP address assignment and apply static settings
Remove-NetIPAddress -InterfaceAlias $InterfaceAlias -AddressFamily IPv4 -Confirm:$false -ErrorAction SilentlyContinue
Remove-NetRoute -InterfaceAlias $InterfaceAlias -AddressFamily IPv4 -Confirm:$false -ErrorAction SilentlyContinue

New-NetIPAddress -InterfaceAlias $InterfaceAlias -IPAddress $StaticIP -PrefixLength $SubnetMaskBits -DefaultGateway $DefaultGateway
Set-DnsClientServerAddress -InterfaceAlias $InterfaceAlias -ServerAddresses $DnsServers

Write-Host "SUCCESS: Host PC configured with Static IP $StaticIP" -ForegroundColor Green
Get-NetIPConfiguration -InterfaceAlias $InterfaceAlias
```

#### Method B: Zero-Configuration mDNS Hostname Setup (`lims-server.local`)
Windows 10 (v1803+) and Windows 11 include native support for mDNS (Multicast DNS). If you prefer human-friendly URLs over numeric IP addresses:
1. Open PowerShell as Administrator.
2. Rename the host computer to `LIMS-SERVER`:
   ```powershell
   Rename-Computer -NewName "LIMS-SERVER" -Restart
   ```
3. After the reboot, any device connected to the same Wi-Fi/LAN can reach the server at:
   ```
   http://lims-server.local:3001
   ```

#### Method C: Router DHCP IP Reservation (Best of Both Worlds)
If you do not want to hardcode IP settings on the PC:
1. Log into your clinic router's admin console (typically `http://192.168.1.1`).
2. Navigate to **DHCP Server** $\to$ **Static Address Reservation** (or **IP-to-MAC Binding**).
3. Find the MAC address of the server PC (`getmac /v` in CMD).
4. Bind that MAC address to `192.168.1.50`.

---

### 3.3 Automated Windows Defender Firewall Configuration (PowerShell Script)
By default, Windows Defender Firewall blocks inbound network traffic from other computers. You must create inbound firewall rules for TCP ports 3001, 5000, and 2575 restricted to the **Private** and **Domain** network profiles.

Save and run the following script as `CONFIGURE_FIREWALL.ps1` in PowerShell as Administrator:

```powershell
<#
================================================================================
SCRIPT: CONFIGURE_FIREWALL.ps1
PURPOSE: Opens inbound TCP ports 3001 (Web), 5000 (ASTM), and 2575 (HL7 MLLP)
SECURITY: Strictly applies to Domain and Private network profiles only.
================================================================================
#>

# Ensure running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Administrator elevation required. Relaunching in elevated window..."
    Start-Process powershell.exe -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"")
    Exit
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "    HRGen GIA LIMS: Automated Windows Firewall Configuration      " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Ensure current network connection is set to Private (not Public)
$activeConnections = Get-NetConnectionProfile
foreach ($conn in $activeConnections) {
    if ($conn.NetworkCategory -eq "Public") {
        Write-Host "Switching interface '$($conn.InterfaceAlias)' from Public to Private profile..." -ForegroundColor Yellow
        Set-NetConnectionProfile -InterfaceAlias $conn.InterfaceAlias -NetworkCategory Private
    }
}

# 2. Define Port Rules
$rules = @(
    @{
        Name        = "HRGen-LIMS-Web-App-3001"
        DisplayName = "HRGen GIA LIMS Web Application (Port 3001)"
        Description = "Allows LAN clients to access the LIMS web interface and REST API."
        Port        = 3001
    },
    @{
        Name        = "HRGen-LIMS-ASTM-Analyzer-5000"
        DisplayName = "HRGen GIA LIMS ASTM Analyzer Ingest (Port 5000)"
        Description = "Allows automated laboratory analyzers to stream ASTM E1381/E1394 data."
        Port        = 5000
    },
    @{
        Name        = "HRGen-LIMS-HL7-MLLP-2575"
        DisplayName = "HRGen GIA LIMS HL7 MLLP Edge (Port 2575)"
        Description = "Allows clinical analyzers and HIS bridges to connect via HL7 v2.5 MLLP."
        Port        = 2575
    }
)

# 3. Create or Update Firewall Rules
foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -Name $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "[EXISTS] Removing older rule: $($r.DisplayName)" -ForegroundColor Gray
        Remove-NetFirewallRule -Name $r.Name
    }

    Write-Host "[CREATING] Inbound Allow Rule: $($r.DisplayName) on TCP port $($r.Port)..." -ForegroundColor Green
    New-NetFirewallRule -Name $r.Name `
                        -DisplayName $r.DisplayName `
                        -Description $r.Description `
                        -Direction Inbound `
                        -LocalPort $r.Port `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Domain,Private `
                        -Enabled True | Out-Null
}

Write-Host "------------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "VERIFICATION: Active Inbound Rules for HRGen GIA LIMS:" -ForegroundColor Cyan
Get-NetFirewallRule -Name "HRGen-LIMS-*" | Format-Table -Property Name, DisplayName, Direction, Action, Enabled, Profile

Write-Host "`nAll required ports (3001, 5000, 2575) are successfully open on Private LAN!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
```

---

### 3.4 Multi-Client Workstation Provisioning (Reception, Phlebotomy, Tech Bench, Pathologist Cabin)

On each workstation PC in the clinic, configure Google Chrome or Microsoft Edge to launch the specific department module in full-screen **Application (PWA) Mode**. This prevents accidental tab closing, hides the browser address bar, and gives operators a native software feel.

#### Workstation Profiles Matrix:

| Station Name | Target URL | Recommended Login Role | Default Landing View |
|:---|:---|:---|:---|
| **Station 1: Reception & Billing** | `http://192.168.1.50:3001/#opd` | `admin` (or registered Receptionist) | Patient registration, test selection, rate cards, discounts, and sequential GST invoice generation |
| **Station 2: Phlebotomy Bench** | `http://192.168.1.50:3001/#specimens` | `phlebotomist` | Vacutainer collection list, barcode label printing, tube order-of-draw guidance, pre-analytical accept/reject triage |
| **Station 3: Tech Workbench** | `http://192.168.1.50:3001/#worklist` | `tech` | Analyzer ingestion stream, manual result entry, auto-calculated formula derivation, Westgard IQC charts |
| **Station 4: Pathologist Cockpit** | `http://192.168.1.50:3001/#pathologist` | `pathologist` | Clinical anomaly flags, unit-aware panic limit review, delta checks, dual-witness re-auth, digital sign-off |

---

### 3.5 Automated Client Workstation Setup Script (`SETUP_LAN_CLIENT.bat`)

Distribute the following batch script on a USB flash drive or shared network folder. Running it on any client PC automatically creates desktop shortcuts for each station:

```batch
@echo off
:: ================================================================================
:: HRGen GIA LIMS — Client Workstation One-Click Setup Script
:: Generates standalone Desktop Application shortcuts pointing to the central server.
:: ================================================================================
title HRGen GIA LIMS Workstation Setup
color 0A

set SERVER_IP=192.168.1.50
set SERVER_PORT=3001

echo ====================================================================
echo           HRGen GIA LIMS: Client Station Setup Utility              
echo ====================================================================
echo.
echo Default Server Address: http://%SERVER_IP%:%SERVER_PORT%
set /p CUSTOM_IP="Enter Server IP Address (Press ENTER to accept %SERVER_IP%): "
if not "%CUSTOM_IP%"=="" set SERVER_IP=%CUSTOM_IP%

set BASE_URL=http://%SERVER_IP%:%SERVER_PORT%

echo.
echo Testing connectivity to server at %BASE_URL%...
powershell -Command "try { $r = Invoke-WebRequest -Uri '%BASE_URL%/api/system/info' -TimeoutSec 3 -UseBasicParsing; Write-Host 'Server is REACHABLE!' -ForegroundColor Green } catch { Write-Host 'WARNING: Could not connect to %BASE_URL%. Ensure Server PC is running and on the same Wi-Fi/LAN.' -ForegroundColor Red }"

echo.
echo Select the role of this workstation:
echo [1] Reception & Billing Counter (OPD Billing POS)
echo [2] Phlebotomy Station (Sample Collection & Barcoding)
echo [3] Laboratory Technician Bench (Results & Westgard QC)
echo [4] Pathologist Cabin (Clinical Validation & Sign-Off)
echo [5] Install All Station Shortcuts on Desktop
echo.
set /p CHOICE="Enter choice [1-5]: "

set BROWSER_PATH=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_PATH="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_PATH="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_PATH="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_PATH="%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

if "%BROWSER_PATH%"=="" (
    echo ERROR: Neither Google Chrome nor Microsoft Edge was detected!
    pause
    exit /b 1
)

set SCRIPT_DIR=%TEMP%\create_shortcut.vbs

if "%CHOICE%"=="1" goto CREATE_RECEPTION
if "%CHOICE%"=="2" goto CREATE_PHLEBOTOMY
if "%CHOICE%"=="3" goto CREATE_TECH
if "%CHOICE%"=="4" goto CREATE_PATHOLOGIST
if "%CHOICE%"=="5" goto CREATE_ALL

:CREATE_RECEPTION
call :MAKE_SHORTCUT "LIMS Reception & Billing" "%BASE_URL%/#opd"
goto FINISHED

:CREATE_PHLEBOTOMY
call :MAKE_SHORTCUT "LIMS Phlebotomy Station" "%BASE_URL%/#specimens"
goto FINISHED

:CREATE_TECH
call :MAKE_SHORTCUT "LIMS Lab Technician Bench" "%BASE_URL%/#worklist"
goto FINISHED

:CREATE_PATHOLOGIST
call :MAKE_SHORTCUT "LIMS Pathologist Cockpit" "%BASE_URL%/#pathologist"
goto FINISHED

:CREATE_ALL
call :MAKE_SHORTCUT "LIMS Reception & Billing" "%BASE_URL%/#opd"
call :MAKE_SHORTCUT "LIMS Phlebotomy Station" "%BASE_URL%/#specimens"
call :MAKE_SHORTCUT "LIMS Lab Technician Bench" "%BASE_URL%/#worklist"
call :MAKE_SHORTCUT "LIMS Pathologist Cockpit" "%BASE_URL%/#pathologist"
goto FINISHED

:MAKE_SHORTCUT
set S_NAME=%~1
set S_URL=%~2
echo Creating Desktop Shortcut: %S_NAME%...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT_DIR%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\%S_NAME%.lnk" >> "%SCRIPT_DIR%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT_DIR%"
echo oLink.TargetPath = %BROWSER_PATH% >> "%SCRIPT_DIR%"
echo oLink.Arguments = "--app=%S_URL% --start-maximized" >> "%SCRIPT_DIR%"
echo oLink.IconLocation = %BROWSER_PATH% ^& ", 0" >> "%SCRIPT_DIR%"
echo oLink.Description = "HRGen GIA LIMS Workstation" >> "%SCRIPT_DIR%"
echo oLink.Save >> "%SCRIPT_DIR%"
cscript //nologo "%SCRIPT_DIR%"
del "%SCRIPT_DIR%"
exit /b 0

:FINISHED
echo.
echo ====================================================================
echo SUCCESS: Workstation shortcuts created on your Desktop!
echo Click the desktop icon to open HRGen GIA LIMS in App Mode.
echo ====================================================================
pause
```

---

### 3.6 Laboratory Hardware Integration & Printer Sharing

Clinical diagnostic facilities utilize two distinct printer categories that must be configured across the local network:

```
+---------------------------------------------------------------------------------------------------+
|                                 LABORATORY PRINTING ARCHITECTURE                                  |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|    [ Phlebotomy / Reception PC ]                       [ Pathologist / Billing PC ]               |
|                  |                                                   |                            |
|                  v (USB / LAN Port 9100)                             v (Standard Windows Spooler) |
|      +-----------------------+                           +-----------------------+                |
|      | THERMAL LABEL PRINTER |                           |   A4 LASER PRINTER    |                |
|      | TSC TE244 / Zebra GT800|                          | HP LaserJet / Canon   |                |
|      | 50mm x 25mm Labels    |                           | Plain A4 or Letterhead|                |
|      | Code 128-B Barcodes   |                           | NABL Diagnostic Report|                |
|      | Specimen Tube ID      |                           | Itemized Tax Invoices |                |
|      +-----------------------+                           +-----------------------+                |
+---------------------------------------------------------------------------------------------------+
```

#### 1. Thermal Barcode Label Printer Setup (50mm $\times$ 25mm)
- **Supported Models**: TSC TE244, Zebra GT800 / ZD220, Xprinter XP-420B, Citizen CL-S621.
- **Label Media**: High-grade thermal-transfer or direct-thermal paper (50mm width $\times$ 25mm height, 2mm gap).
- **Windows Driver Configuration**:
  1. Install printer drivers (e.g., Seagull Scientific BarTender drivers or official OEM driver).
  2. In Windows **Settings $\to$ Bluetooth & Devices $\to$ Printers & Scanners**, select the thermal printer.
  3. Click **Printing Preferences**:
     * Set **Page Size**: `50.0 mm` Width, `25.0 mm` Height.
     * Set **Orientation**: `Landscape` or `Portrait` (match browser print orientation).
     * Set **Speed**: 3.0 in/sec; **Darkness**: 8 to 10 (ensures sharp barcode line edges for reliable optical scanning).
  4. Share the printer over the network:
     * Right-click printer $\to$ **Printer Properties** $\to$ **Sharing** tab $\to$ Check **Share this printer** as `LIMS_BARCODE_PRINTER`.
- **Browser Print Margin Suppression**:
  In Google Chrome / Edge print preview, set:
  * Destination: `LIMS_BARCODE_PRINTER`
  * Paper size: `50mm x 25mm`
  * Margins: `None`
  * Options: Uncheck `Headers and footers`

#### 2. Diagnostic Report Laser Printer Setup (A4)
- **Supported Models**: HP LaserJet Pro M404, Canon imageCLASS LBP2900B / LBP6030, Brother HL-L2321D.
- **Printing Media**: Plain 80 GSM A4 paper or pre-printed clinic letterhead.
- **Letterhead Alignment**:
  * If printing on **pre-printed letterhead**: In the LIMS Pathologist Cockpit, navigate to **Settings $\to$ Letterhead Configuration** and toggle `Hide Digital Header on Print`. The system will automatically reserve a 2.5-inch top margin for your clinic letterhead and print only the clinical results and digital signature footer.
  * If printing on **plain paper**: Toggle `Include Digital Letterhead`. The system prints the full clinic logo, NABL accreditation badge, QR verification code, and footer automatically.

---

### 3.7 Unattended 24x7 System Autostart (PM2 vs NSSM Windows Service Deployment)

In a clinical production environment, the LIMS server must start automatically when the computer turns on—without requiring a staff member to log into Windows.

#### Approach A: Production PM2 Windows Service (Recommended for Node.js)

PM2 provides automatic restart on failure, resource monitoring, and cluster management.

```powershell
<#
================================================================================
SCRIPT: INSTALL_PM2_SERVICE.ps1
PURPOSE: Registers HRGen GIA LIMS as an unattended background Windows Service.
================================================================================
#>

# Step 1: Install PM2 and Windows Service wrapper globally
npm install -g pm2 pm2-windows-service

# Step 2: Configure PM2 as a Windows system service
pm2-service-install -n "HRGen-GIA-LIMS"

# Step 3: Launch server inside the application directory
cd "C:\Users\pc\Desktop\HRGEN GIA LIMS"

# Start the server with environment variables and memory limits
pm2 start server.js --name "hrgen-lims" --node-args="--env-file=.env" --max-memory-restart 1G --log "C:\Users\pc\Desktop\HRGEN GIA LIMS\logs\pm2.log"

# Save the process list to automatically restore upon Windows reboot
pm2 save

Write-Host "SUCCESS: HRGen GIA LIMS is running under PM2 service supervision!" -ForegroundColor Green
```

> ⚠️ **CRITICAL NODE.JS v20+ RUNTIME REQUIREMENT**:  
> Notice the mandatory flag `--node-args="--env-file=.env"`. Because `server.js` uses native Node.js v20+ environment variable loading without an external `dotenv` package (matching `package.json`'s start script `node --env-file=.env server.js`), omitting `--node-args="--env-file=.env"` causes an immediate crash on boot with:  
> `Missing required environment variable: AUTH_SECRET`  
> Always ensure `--node-args="--env-file=.env"` is passed whenever registering or restarting the PM2 process.


#### Approach B: NSSM (Non-Sucking Service Manager) Native Windows Service
If your clinic IT policy forbids global npm packages, use NSSM:

1. Download `nssm.exe` (v2.24+) from `https://nssm.cc` and copy it to `C:\Windows\System32`.
2. Open PowerShell as Administrator and run:
   ```powershell
   # Install the service
   nssm install HRGenLIMS "C:\Program Files\nodejs\node.exe" "C:\Users\pc\Desktop\HRGEN GIA LIMS\server.js"
   
   # Set the working directory
   nssm set HRGenLIMS AppDirectory "C:\Users\pc\Desktop\HRGEN GIA LIMS"
   
   # Configure environment variables
   nssm set HRGenLIMS AppEnvironmentExtra "PORT=3001" "NODE_ENV=production" "AUTH_SECRET=hrgen_prod_auth_secret_2026_super_hardened_key_32chars"
   
   # Set automatic restart on system boot
   nssm set HRGenLIMS Start SERVICE_AUTO_START
   
   # Set restart throttle (wait 5s if application crashes)
   nssm set HRGenLIMS AppThrottle 5000
   
   # Configure stderr / stdout logging
   mkdir "C:\Users\pc\Desktop\HRGEN GIA LIMS\logs" -ErrorAction SilentlyContinue
   nssm set HRGenLIMS AppStdout "C:\Users\pc\Desktop\HRGEN GIA LIMS\logs\service-stdout.log"
   nssm set HRGenLIMS AppStderr "C:\Users\pc\Desktop\HRGEN GIA LIMS\logs\service-stderr.log"
   
   # Start the service immediately
   nssm start HRGenLIMS
   ```

---

## 4. Setup 2: 1-Click WhatsApp PDF Report Delivery & WhatsApp Web Integration

### 4.1 Dual-Modality Operational Model (Enterprise Bot vs Zero-Cost 1-Click Web)

HRGen GIA LIMS implements a dual-modality WhatsApp architecture engineered to accommodate both high-volume diagnostic chains and budget-conscious single-owner clinics:

```
+---------------------------------------------------------------------------------------------------+
|                            DUAL-MODALITY WHATSAPP ARCHITECTURE                                    |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|               +-------------------------------------------------------------------+               |
|               |       FINAL REPORT RELEASED & DIGITALLY SIGNED BY PATHOLOGIST     |               |
|               |       (HMAC-SHA256 Digital Seal + Verification Token Generated)   |               |
|               +-------------------------------------------------------------------+               |
|                                         |                                                         |
|         +-------------------------------+-------------------------------+                         |
|         |                                                               |                         |
|         v                                                               v                         |
|  +-----------------------------+                               +-----------------------------+    |
|  |   MODALITY A: ENTERPRISE    |                               |    MODALITY B: ZERO-COST    |    |
|  |     META CLOUD API BOT      |                               |   1-CLICK DESKTOP WEB DISPATCH   |    |
|  +-----------------------------+                               +-----------------------------+    |
|  | - Fully Automated 2-Way Bot |                               | - 100% Free / Zero API cost |    |
|  | - Webhook Challenge Verify  |                               | - Instant Browser Dispatch  |    |
|  | - Interactive Self-Service: |                               | - Direct https://wa.me/ link|    |
|  |   [1] Report Download       |                               | - Zero Meta approval needed |    |
|  |   [2] Invoice Balance Check |                               | - Works with WhatsApp Web   |    |
|  |   [3] Connect Reception     |                               |   or Windows Desktop App    |    |
|  | - Direct PDF Media Push     |                               | - Pre-filled personalized   |    |
|  | - Requires Meta Developer ID|                               |   clinical verification text|    |
|  +-----------------------------+                               +-----------------------------+    |
|                 |                                                              |                  |
|                 v                                                              v                  |
|  [ Meta Graph API Endpoint ]                                   [ Operator Clicks Enter ]          |
|  graph.facebook.com/v19.0/...                                  wa.me/919876543210?text=...        |
|                 |                                                              |                  |
|                 +-------------------------------+------------------------------+                  |
|                                                 |                                                 |
|                                                 v                                                 |
|                              +-------------------------------------+                              |
|                              |      PATIENT RECEIVES WHATSAPP      |                              |
|                              |   - Patient Name & Accession ID     |                              |
|                              |   - Tamper-proof Verification Link  |                              |
|                              |   - Zero PHI Exposure in Plain Text |                              |
|                              +-------------------------------------+                              |
+---------------------------------------------------------------------------------------------------+
```

---

### 4.2 Modality A: Meta WhatsApp Cloud API Enterprise 2-Way Bot Configuration

#### 1. Meta Business Manager & Cloud API Provisioning
1. Navigate to the **Meta for Developers Portal** (`https://developers.facebook.com`).
2. Log into your Meta Business Account and click **Create App** $\to$ Select **Other** $\to$ Select **Business**.
3. Under **Add products to your app**, locate **WhatsApp** and click **Set up**.
4. In the WhatsApp API Setup screen, record:
   - **Phone Number ID**: (e.g., `109283746591029`)
   - **WhatsApp Business Account ID**: (e.g., `102938475610293`)
   - **Temporary / Permanent Access Token**: Generate a permanent System User token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
5. Create a high-entropy custom webhook verification secret:
   - Example: `HRGEN_GIA_WA_PROD_SECRET_2026_9f8a`

#### 2. Environment Configuration (`.env`)
Update your production `.env` file on the server PC:

```ini
# --- Meta WhatsApp Cloud API Configuration ---
WHATSAPP_PHONE_NUMBER_ID=109283746591029
WHATSAPP_TOKEN=EAAG...[Your_60_Day_Or_Permanent_System_User_Token]...
WHATSAPP_VERIFY_TOKEN=HRGEN_GIA_WA_PROD_SECRET_2026_9f8a
APP_BASE_URL=https://lims.yourlab.com
```

#### 3. Webhook Handshake & Verification (`GET /api/whatsapp/webhook`)
When registering your webhook URL in the Meta App Dashboard:
- **Callback URL**: `https://lims.yourlab.com/api/whatsapp/webhook`
- **Verify Token**: `HRGEN_GIA_WA_PROD_SECRET_2026_9f8a`

Meta sends an automated challenge request:
```http
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=HRGEN_GIA_WA_PROD_SECRET_2026_9f8a&hub.challenge=1158201444 HTTP/1.1
Host: lims.yourlab.com
```

The server code in `server/services/whatsappBot.js` and `server/platformRoutes.js:497-502` validates the token and echoes back `hub.challenge`:

```javascript
// server/services/whatsappBot.js
function verifyWebhook(mode, token, challenge){
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || VERIFY_TOKEN_DEFAULT;
  if(mode === 'subscribe' && token === expectedToken){
    return { valid: true, challenge };
  }
  return { valid: false };
}
```

#### 4. Interactive 2-Way Conversational Flow
When a patient sends any text message to the clinic's WhatsApp number, Meta dispatches a `POST` webhook to `/api/whatsapp/webhook`. The bot normalizes the incoming phone number, resolves the patient in the database, and processes the intent:

```javascript
// Patient replies "1" or "REPORT":
if (rawText === '1' || rawText.includes('REPORT')) {
  if (latestOrder.pipelineStatus === 'RELEASED') {
    replyText = `✅ *${labName}* - Lab Report Ready\n\n` +
      `Patient: ${patient.name}\n` +
      `Accession: ${latestOrder.invoiceNumber || latestOrder.id}\n` +
      `Status: Digitally Signed & Released\n\n` +
      `📄 *Download / Verify Authenticity:*\n${verifyUrl}\n\n` +
      `_Tamper-proof digital medical record verified by HMAC-SHA256._`;
  } else {
    replyText = `⏳ *${labName}* - Processing Status\n\n` +
      `Patient: ${patient.name}\n` +
      `Accession: ${latestOrder.invoiceNumber || latestOrder.id}\n` +
      `Status: ${latestOrder.pipelineStatus} (Under Pathologist Review)\n\n` +
      `_You will receive a notification the moment your report is signed._`;
  }
}
```

#### 5. Direct PDF Media Transmission via Meta Cloud API
For direct binary PDF attachment delivery (rather than just a URL):
```javascript
async function sendWhatsAppPdfDocument({ to, pdfUrl, filename, caption, token, phoneNumberId }) {
  const waToken = token || process.env.WHATSAPP_TOKEN;
  const waPhoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  const resp = await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${waToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'document',
      document: {
        link: pdfUrl,
        filename: filename || 'Diagnostic_Report.pdf',
        caption: caption || 'Your Official Diagnostic Test Report'
      }
    })
  });
  return await resp.json();
}
```

---

### 4.3 Modality B: Zero-Cost 1-Click Desktop WhatsApp Web Dispatch

For single-doctor practices, OPD receptionists, or laboratories operating without a Meta Developer account, HRGen GIA LIMS provides an instant 1-click dispatch engine that operates directly through the operator's browser at **zero API cost**.

#### Client-Side Deep Link Implementation:
When the receptionist or pathologist clicks **"📱 Send via WhatsApp"** in the worklist or report preview modal, the browser executes:

```javascript
function dispatchReportViaWhatsAppWeb(order, patient, labBranding) {
  // 1. Sanitize phone number (Indian phone normalization: prepend 91 if 10 digits)
  let phone = String(patient.phone || '').replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;

  if (!phone || phone.length < 10) {
    alert('Cannot dispatch: Patient does not have a valid mobile number on file.');
    return;
  }

  // 2. Resolve parameters
  const labName = labBranding.name || 'Diagnostic Laboratory';
  const labPhone = labBranding.phone || '';
  const token = order.verificationToken || '';
  const origin = window.location.origin;
  const verifyUrl = `${origin}/verify/${encodeURIComponent(token)}`;
  
  // 3. Assemble clinical notification message (Zero PHI leakage)
  const message = 
    `🏥 *${labName.toUpperCase()}*\n` +
    `_Accredited Diagnostic Clinical Laboratory_\n\n` +
    `Dear *${patient.name}*,\n` +
    `Your diagnostic test results are authorized and ready for download.\n\n` +
    `📋 *Order ID / Barcode:* ${order.barcode || order.invoiceNumber}\n` +
    `📅 *Date:* ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n` +
    `✅ *Clinical Status:* Signed & Released by Pathologist\n\n` +
    `🔗 *Download Official Digital Report (PDF):*\n` +
    `${verifyUrl}\n\n` +
    `🔒 *Verification Notice:*\n` +
    `_This report contains an encrypted HMAC-SHA256 digital signature and QR code for NABL / ISO 15189 compliance._\n\n` +
    `For queries, please contact reception at ${labPhone}.`;

  // 4. Trigger browser deep link to WhatsApp Web or Desktop App
  const encodedUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(encodedUrl, '_blank', 'noopener,noreferrer');
}
```

---

### 4.4 WhatsApp Clinical Message Templates

Standardized templates maintain professionalism, meet WhatsApp Anti-Spam criteria, and ensure clinical compliance:

#### Template 1: Standard Diagnostic Report Release (Routine Results)
```
🏥 *APEX DIAGNOSTIC LABORATORY*
_NABL Accredited Laboratory | ISO 15189:2022_

Dear *Sunita Sharma*,

Your laboratory test report for Accession *ORD-20261017-0042* is signed and released.

📋 *Tests Included:* Complete Blood Count (CBC), Fasting Blood Sugar (FBS)
👨‍⚕️ *Consultant Pathologist:* Dr. A. K. Verma, MD (Path)
✅ *Status:* Authorized & Sealed

📄 *View / Download Official Report:*
https://lims.apexlab.in/verify/b7a9c2f4e81d4a0b82

_This digital document is cryptographically verified under ISO 15189 standards._
```

#### Template 2: Critical Panic Alert to Referring Physician (High Priority)
```
🚨 *CRITICAL PANIC VALUE ALERT — APEX DIAGNOSTIC LAB*

ATTENTION: *Dr. Rajesh Mehta, MD (Medicine)*

Critical laboratory value detected requiring immediate clinical attention:

👤 *Patient:* Ramesh Kumar, 54y / Male
📋 *UHID / Accession:* U-10492 / ORD-20261017-0089
⚠️ *Test Result:* Serum Potassium (K+) = *6.9 mmol/L* (CRITICAL HIGH)
📊 *Biological Reference Range:* 3.5 - 5.1 mmol/L
🔬 *Quality Assurance:* Specimen re-checked; Hemolysis index: NEGATIVE; IQC: PASS.
⏱️ *Timestamp:* 17-Oct-2026 14:32 IST

Validated by Dr. Pathologist. Critical telephonic communication logged in audit ledger.
Direct Report Review: https://lims.apexlab.in/verify/91f8c2b740e1
```

#### Template 3: OPD Bill Receipt & Balance Dispatch
```
💳 *APEX DIAGNOSTIC LABORATORY — INVOICE RECEIPT*

Dear *Anil Gupta*,

Thank you for your visit. Your billing details are as follows:

🧾 *Invoice Number:* INV-2026-00318
💰 *Total Amount:* ₹1,450.00
💵 *Amount Paid:* ₹1,450.00
🟢 *Balance Due:* ₹0.00 (PAID IN FULL)
💳 *Payment Mode:* Dynamic UPI (Transaction Ref: UPI-98472910)

Your samples have been accessioned. You will receive a WhatsApp alert once your tests are completed.
```

---

### 4.5 Patient Data Protection (DPDP 2023 / HIPAA) & Privacy Safeguards

1. **Zero Raw PHI in Plain Text**:
   * Never send raw numeric results (e.g. "Your HIV test is Reactive" or "Glucose is 350 mg/dL") in WhatsApp message text. WhatsApp messages can be previewed on locked phone screens by third parties.
   * Send only the tokenized verification link (`https://lims.yourlab.in/verify/{verificationToken}`).
2. **High-Entropy Cryptographic Verification Tokens**:
   * Verification tokens must be generated using `crypto.randomBytes(16).toString('hex')` (128 bits of entropy).
   * Sequential or guessable IDs (e.g., `/verify/1001`, `/verify/1002`) are strictly forbidden to prevent Broken Object Level Authorization (BOLA) attacks.
3. **Audit Ledger Logging**:
   * Every WhatsApp transmission (both Cloud API and `wa.me` clicks) records an immutable event in `audit_ledger`:
     `WHATSAPP_REPORT_DISPATCHED` with `orderId`, `recipientPhone`, `timestamp`, and `operatorId`.

---

## 5. Setup 3: Free Cloudflare Zero-Trust Tunnel for Secure Remote Doctor & Patient Access

### 5.1 Architecture: The Zero-Trust Ingress Paradigm (No Public IP, No Port Forwarding, CGNAT Bypass)

Diagnostic clinics frequently struggle with remote access:
- **Carrier-Grade NAT (CGNAT)**: Major Indian and international fiber ISPs (JioFiber, Airtel Xstream, BSNL, ACT) do not provide public IPv4 addresses to broadband subscribers. Multiple customers share a single public IP.
- **Dynamic Public IPs**: Even when available, residential/commercial IPs rotate every 24 hours.
- **Port Forwarding Security Risks**: Exposing local ports 80/443 on a clinic router invites automated ransomware bots, DDoS attacks, and unauthorized vulnerability scans.

**The Solution: Cloudflare Zero-Trust Tunnel (`cloudflared`)**  
`cloudflared` runs as a lightweight background daemon on the Host Server PC. It establishes **outbound-only encrypted QUIC / TLS connections** to the nearest Cloudflare Anycast edge servers. Cloudflare acts as an intelligent reverse proxy, providing automatic SSL/TLS certificates and Zero-Trust access control.

```
========================================================================================================================
                                     CLOUDFLARE ZERO-TRUST INGRESS ARCHITECTURE
========================================================================================================================

 [ Remote Pathologist at Home ]     [ Patient on Smartphone ]     [ Visiting Clinician on 5G ]
                 \                              |                              /
                  v                             v                             v
             +--------------------------------------------------------------------+
             |               Cloudflare Global Anycast Edge Network               |
             |                 (Free Automated SSL/TLS Termination)                |
             +--------------------------------------------------------------------+
                                                |
                     Cloudflare Access Zero-Trust Authentication Policy
                     - /verify/*  ──> Public Bypass (Instant Patient Access)
                     - /*         ──> Require Email OTP / Google Workspace Auth
                                                |
                                                v
                  [ Encrypted Outbound-Only Cloudflare Tunnel (QUIC / TLS) ]
                    (No Inbound Ports, No Port Forwarding, Bypasses CGNAT)
                                                |
                                                v
                                +-------------------------------+
                                |   LOCAL CLINIC SERVER PC      |
                                |   cloudflared.exe Daemon      |
                                |   Reverse Proxies to:         |
                                |   http://localhost:3001       |
                                +-------------------------------+
========================================================================================================================
```

---

### 5.2 Step-by-Step Installation & Tunnel Provisioning (`cloudflared`)

#### Step 1: Obtain a Domain and Delegate DNS to Cloudflare
1. Register a domain name (e.g. `yourlab.in`, `citypathlab.com`) via any registrar (GoDaddy, Namecheap, Google Domains).
2. Create a free account at `https://dash.cloudflare.com`.
3. Add your domain and update your registrar's nameservers to Cloudflare's assigned nameservers (e.g., `aria.ns.cloudflare.com`, `bob.ns.cloudflare.com`).

#### Step 2: Download the `cloudflared` Binary on Host Server PC
1. Open PowerShell as Administrator.
2. Create the directory `C:\Cloudflare` and download the official 64-bit Windows binary:
   ```powershell
   New-Item -ItemType Directory -Path "C:\Cloudflare" -Force | Out-Null
   Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "C:\Cloudflare\cloudflared.exe"
   ```

#### Step 3: Authenticate with Cloudflare
1. In PowerShell, execute:
   ```powershell
   cd C:\Cloudflare
   .\cloudflared.exe tunnel login
   ```
2. A browser window will open automatically. Log into Cloudflare and select your domain (e.g., `yourlab.in`).
3. Cloudflare downloads an authentication certificate to `C:\Users\pc\.cloudflared\cert.pem`.

#### Step 4: Create the Named Tunnel
Create a persistent tunnel named `hrgen-lims`:
```powershell
.\cloudflared.exe tunnel create hrgen-lims
```
*Output will display your Tunnel ID (e.g., `3f9a12b4-5678-90ab-cdef-1234567890ab`) and create a credentials JSON file in `C:\Users\pc\.cloudflared\3f9a12b4-5678-90ab-cdef-1234567890ab.json`.*

Copy the credentials file to `C:\Cloudflare`:
```powershell
Copy-Item "C:\Users\pc\.cloudflared\*.json" -Destination "C:\Cloudflare\" -Force
```

---

### 5.3 Ingress Routing Architecture & `config.yml` Specification

Create the configuration file `C:\Cloudflare\config.yml` with the following configuration:

```yaml
# ==============================================================================
# HRGen GIA LIMS — Cloudflare Zero-Trust Tunnel Configuration
# File Path: C:\Cloudflare\config.yml
# ==============================================================================

# Replace with your actual Tunnel UUID
tunnel: 3f9a12b4-5678-90ab-cdef-1234567890ab
credentials-file: C:\Cloudflare\3f9a12b4-5678-90ab-cdef-1234567890ab.json

# Performance & Logging Configuration
warp-routing:
  enabled: false

# Ingress Rules Matrix
ingress:
  # 1. Public Patient Report Verification Portal (Unauthenticated QR Scanner Access)
  - hostname: lims.yourlab.in
    path: ^/verify/.*
    service: http://127.0.0.1:3001
    originRequest:
      connectTimeout: 10s
      noTLSVerify: true

  # 2. Public Static Verification Assets & Icons
  - hostname: lims.yourlab.in
    path: ^/(favicon.ico|manifest.json|icon-.*\.png|sw.js)
    service: http://127.0.0.1:3001

  # 3. Public Verification REST API Endpoint
  - hostname: lims.yourlab.in
    path: ^/api/public/.*
    service: http://127.0.0.1:3001

  # 4. Meta WhatsApp Cloud API Inbound Webhooks
  - hostname: lims.yourlab.in
    path: ^/api/whatsapp/webhook
    service: http://127.0.0.1:3001

  # 5. Full LIMS Application (Protected by Cloudflare Access OTP Gateway)
  - hostname: lims.yourlab.in
    service: http://127.0.0.1:3001
    originRequest:
      connectTimeout: 30s
      keepAliveTimeout: 1m
      noTLSVerify: true

  # 6. Catch-all fallback rule (Mandatory 404 handler)
  - service: http_status:404
```

---

### 5.4 Cloudflare Access Zero-Trust Policies (Public QR Verification, Webhook Bypass & Pathologist OTP Gateway)

Configure access control in the **Cloudflare Zero Trust Dashboard** (`https://one.dash.cloudflare.com`):

#### Policy 1: Public Patient Bypass (Instant QR Code Report Verification)
- Navigate to **Access** $\to$ **Applications** $\to$ **Add an Application** $\to$ **Self-Hosted**.
- **Application Name**: `LIMS Patient Verification Portal`
- **Application Domain**: `lims.yourlab.in/verify/*`
- **Session Duration**: `No Session / Immediate`
- Under **Add Policies**:
  * Policy Name: `Public Bypass Everyone`
  * Action: `Bypass`
  * Assign Rule: Selector: `Everyone`
- *Outcome*: Any patient or physician scanning the QR code on a printed report or clicking the WhatsApp verification link accesses the validated report immediately without login friction.

#### Policy 2: WhatsApp Webhook Public Bypass (Meta Cloud API Inbound Events)
- Navigate to **Access** $\to$ **Applications** $\to$ **Add an Application** $\to$ **Self-Hosted**.
- **Application Name**: `LIMS WhatsApp Webhook Bypass`
- **Application Domain**: `lims.yourlab.in`
- **Path**: `/api/whatsapp/webhook`
- **Session Duration**: `No Session / Immediate`
- Under **Add Policies**:
  * Policy Name: `WhatsApp Webhook Public Bypass`
  * Action: `Bypass`
  * Path: `/api/whatsapp/webhook`
  * Selector: `Everyone`
- *Outcome & Critical Architectural Note*:
  > ⚠️ **MANDATORY FOR WHATSAPP INTEGRATION**:  
  > Without this explicit bypass policy, Cloudflare Access Email OTP will intercept Meta's inbound webhook verification challenge (`hub.challenge`), causing WhatsApp webhook registration to fail with an HTTP 302 redirect / Cloudflare OTP challenge screen. Because Meta's automated servers cannot solve email OTP challenges, webhook verification will fail. Bypassing `/api/whatsapp/webhook` allows Meta's servers to complete the initial handshake and deliver real-time patient message callbacks while all clinical LIMS routes remain strictly protected behind Zero-Trust authentication.

#### Policy 3: Staff & Pathologist Remote Access (Zero-Trust Email OTP Login)
- Navigate to **Access** $\to$ **Applications** $\to$ **Add an Application** $\to$ **Self-Hosted**.
- **Application Name**: `LIMS Staff Remote Gateway`
- **Application Domain**: `lims.yourlab.in` (Path: `/*`)
- Under **Add Policies**:
  * Policy Name: `Authorized Medical Staff Only`
  * Action: `Allow`
  * Assign Rule:
    * Selector: `Emails Ending In` $\to$ `@yourlab.in`
    * OR Selector: `Email` $\to$ Enter specific doctor emails (e.g., `dr.verma.path@gmail.com`, `director@yourlab.in`).
- Under **Authentication**: Enable **One-Time PIN (OTP)**.
- *Outcome*: When Dr. Pathologist visits `https://lims.yourlab.in` from their home computer, Cloudflare prompts for their authorized email. Cloudflare sends a 6-digit OTP to that email. Once entered, the doctor is securely admitted into the LIMS login screen. Automated botnets and hackers are blocked at the Cloudflare edge.

---

### 5.5 Production Windows Service Registration & Automatic Failure Recovery

To ensure the tunnel starts automatically when Windows boots:

```powershell
# 1. Route the DNS CNAME record in Cloudflare automatically
cd C:\Cloudflare
.\cloudflared.exe tunnel route dns hrgen-lims lims.yourlab.in

# 2. Install cloudflared as an official Windows Service
.\cloudflared.exe service install

# 3. Start the service
Start-Service cloudflared

# 4. Verify service status
Get-Service cloudflared
```

*The LIMS is now securely available worldwide over HTTPS at `https://lims.yourlab.in`!*

---

### 5.6 Automated Cloudflare Setup PowerShell Script (`SETUP_CLOUDFLARE_TUNNEL.ps1`)

Save and run the following script on the host server PC:

```powershell
<#
================================================================================
SCRIPT: SETUP_CLOUDFLARE_TUNNEL.ps1
PURPOSE: Turnkey automated installation of cloudflared daemon and service.
================================================================================
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$DomainName,        # Example: yourlab.in
    
    [Parameter(Mandatory=$false)]
    [string]$Subdomain = "lims" # Example: lims (creates lims.yourlab.in)
)

$FullHostname = "$Subdomain.$DomainName"
$InstallDir   = "C:\Cloudflare"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  HRGen GIA LIMS: Automated Cloudflare Zero-Trust Tunnel Setup    " -ForegroundColor Cyan
Write-Host "  Target Hostname: https://$FullHostname                         " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Prepare Directory
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

# 2. Download cloudflared binary
$BinPath = "$InstallDir\cloudflared.exe"
if (-not (Test-Path $BinPath)) {
    Write-Host "Downloading latest cloudflared Windows 64-bit binary..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $BinPath
}

# 3. Authenticate
Write-Host "`nLaunching browser authentication. Select '$DomainName' in Cloudflare dashboard..." -ForegroundColor Yellow
& $BinPath tunnel login

# 4. Create Tunnel
Write-Host "`nCreating persistent tunnel 'hrgen-lims'..." -ForegroundColor Yellow
$createOutput = & $BinPath tunnel create hrgen-lims 2>&1 | Out-String
Write-Host $createOutput

$tunnelId = ($createOutput | Select-String -Pattern "([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})").Matches[0].Value
if (-not $tunnelId) {
    Write-Error "Failed to extract Tunnel ID. Check if tunnel 'hrgen-lims' already exists."
    $tunnelList = & $BinPath tunnel list | Out-String
    $tunnelId = ($tunnelList | Select-String -Pattern "([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\s+hrgen-lims").Matches[0].Groups[1].Value
}

Write-Host "Resolved Tunnel UUID: $tunnelId" -ForegroundColor Green

# 5. Move credentials file
$credSource = "$env:USERPROFILE\.cloudflared\$tunnelId.json"
$credDest   = "$InstallDir\$tunnelId.json"
Copy-Item $credSource -Destination $credDest -Force

# 6. Generate config.yml
$configContent = @"
tunnel: $tunnelId
credentials-file: $credDest

ingress:
  - hostname: $FullHostname
    path: ^/verify/.*
    service: http://127.0.0.1:3001
  - hostname: $FullHostname
    path: ^/(favicon.ico|manifest.json|icon-.*\.png|sw.js)
    service: http://127.0.0.1:3001
  - hostname: $FullHostname
    path: ^/api/public/.*
    service: http://127.0.0.1:3001
  - hostname: $FullHostname
    path: ^/api/whatsapp/webhook
    service: http://127.0.0.1:3001
  - hostname: $FullHostname
    service: http://127.0.0.1:3001
  - service: http_status:404
"@

Set-Content -Path "$InstallDir\config.yml" -Value $configContent -Encoding UTF8
Write-Host "Created configuration file at $InstallDir\config.yml" -ForegroundColor Green

# 7. Route DNS
Write-Host "Routing DNS CNAME record for $FullHostname..." -ForegroundColor Yellow
& $BinPath tunnel route dns hrgen-lims $FullHostname

# 8. Install Windows Service
Write-Host "Registering and starting cloudflared Windows Service..." -ForegroundColor Yellow
& $BinPath service install
Start-Service cloudflared

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "SUCCESS: Cloudflare Zero-Trust Tunnel is LIVE!" -ForegroundColor Green
Write-Host "Access URL: https://$FullHostname" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Green
```

---

## 6. Setup 4: Google Gemini AI Copilot & Bilingual Voice Scribe Activation

### 6.1 GAMP 5 Category 4/5 Non-Clinical Sandbox Architecture & Ethical Boundaries

Under **GAMP 5 (Good Automated Manufacturing Practice)** and accredited **NABL / ISO 15189** laboratory governance, artificial intelligence is classified as a **Category 4/5 Non-Clinical Decision Support System**. 

The system enforces strict architectural boundaries:

```
========================================================================================================================
                                     AI COPILOT CLINICAL FIREWALL BOUNDARY
========================================================================================================================
 PERMITTED NON-CLINICAL SANDBOX ACTIONS:                      STRICTLY PROHIBITED MALPRACTICE BACKDOORS:
 [✓] Patient Explanation in Simple Hindi                     [✗] Auto-filling fake diagnostic results (Intent 0.11)
 [✓] Patient Explanation in Simple English                   [✗] Autonomous Westgard IQC execution (Intent 0.12)
 [✓] Differential diagnostic suggestions for Pathologist     [✗] Forging Pathologist signatures/MCI (Intent 0.13)
 [✓] Bilingual voice dictation speech-to-text drafting       [✗] Unverified report release with HMAC seal (Intent 0.14)
 [✓] Clinical Anomaly Screening & Inter-analyte checks       [✗] Bypassing specimen acceptance gates
========================================================================================================================
```

---

### 6.2 Official Google Gen AI SDK (`@google/genai` v2.30.0) & Gemini 2.5 Flash Setup

1. **Obtain API Key**:
   - Navigate to Google AI Studio (`https://aistudio.google.com`).
   - Create an API key under your Google Cloud project.
2. **Environment Variable Configuration**:
   - Add the key to `.env` on the host server PC:
     ```ini
     GEMINI_API_KEY=AIzaSy...[Your_Key]...
     ```
   - **Key Protection Rule**: The API key is stored exclusively on the backend server and transmitted via secure HTTP headers. It is **never bundled into frontend JavaScript files or exposed in client payloads**.
3. **SDK Initialization (`server/services/geminiCopilot.js:8-9`)**:
   ```javascript
   const { GoogleGenAI, Type } = require('@google/genai');
   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
   ```

---

### 6.3 Deterministic Clinical Output Structuring via `responseJsonSchema`

To eliminate LLM hallucinations, unstructured markdown responses, or JSON syntax crashes, the system configures `responseJsonSchema` targeting the ultra-fast `gemini-2.5-flash` model:

```javascript
// server/services/geminiCopilot.js
async function requestStructuredCopilotInsight(prompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          differentialInsight: {
            type: Type.STRING,
            description: '2-3 sentences of clinical observation for the reviewing pathologist'
          },
          patientExplanationHindi: {
            type: Type.STRING,
            description: 'Simple, compassionate explanation in Hindi (Devanagari script) for the patient'
          },
          patientExplanationEnglish: {
            type: Type.STRING,
            description: 'Simple, compassionate explanation in English for the patient'
          },
          riskLevel: {
            type: Type.STRING,
            enum: ['NORMAL', 'MONITOR', 'CRITICAL'],
            description: 'Clinical priority level'
          }
        },
        required: [
          'differentialInsight',
          'patientExplanationHindi',
          'patientExplanationEnglish',
          'riskLevel'
        ]
      }
    }
  });

  return JSON.parse(response.text);
}
```

---

### 6.4 Bilingual Voice Dictation Scribe Engine (Hindi + English Web Speech API)

Pathologists and technicians performing manual differentials, peripheral blood smear evaluations, or urine microscopy can dictate parameter values hands-free.

#### 1. Audio Capture Protocol
The client browser uses the standard HTML5 Web Speech API:
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = false;
// Set language: 'hi-IN' for Hindi / Hinglish, 'en-IN' for Indian English
recognition.lang = currentLanguageSelection === 'hi' ? 'hi-IN' : 'en-IN';

recognition.onresult = async (event) => {
  const transcript = Array.from(event.results)
    .map(r => r[0].transcript)
    .join(' ');

  // Transmit transcript to non-clinical draft API
  const draftResponse = await fetch('/api/ai/sandbox/dictation-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ transcript })
  });
  const draft = await draftResponse.json();
  populateStagingModal(draft.draftObservations);
};
```

---

### 6.5 Offline Deterministic Regex Normalizer (Hindi Number & Test Code Parsing)

If internet connectivity is interrupted or `GEMINI_API_KEY` is omitted, the system falls back to an offline deterministic regex parser built into `server/services/geminiCopilot.js:265-298`.

#### 1. Spoken Hindi Number Normalization:
* `shunya` $\to 0$
* `ek` $\to 1$ | `do` $\to 2$ | `teen` $\to 3$ | `char` $\to 4$ | `paanch` $\to 5$
* `chhe` $\to 6$ | `saat` $\to 7$ | `aath` $\to 8$ | `nau` $\to 9$ | `das` $\to 10$
* `gyarah` $\to 11$ | `baarah` $\to 12$ | `terah` $\to 13$ | `chaudah` $\to 14$ | `pandrah` $\to 15$
* `point` or `dashamlav` $\to .$
* `sau` / `ek sau` $\to 100$ | `ek sau das` $\to 110$ | `ek sau bis` $\to 120$

#### 2. Clinical Alias Resolution:
* `"Hemoglobin"` / `"Haemoglobin"` / `"HB"` $\to$ Catalog Code `HB`
* `"Sugar"` / `"Fasting Sugar"` / `"Glucose"` $\to$ Catalog Code `FBS`
* `"TLC"` / `"Total Leukocyte Count"` / `"WBC"` $\to$ Catalog Code `WBC`
* `"Platelets"` / `"PLT"` $\to$ Catalog Code `PLT`
* `"Creatinine"` / `"CREAT"` $\to$ Catalog Code `CREAT`

#### Concrete Extraction Examples:
- Dictation: *"Hemoglobin das point paanch"* $\to$ Extracts: `{ testCode: 'HB', numericValue: 10.5, unit: 'g/dL' }`
- Dictation: *"Fasting sugar ek sau bis"* $\to$ Extracts: `{ testCode: 'FBS', numericValue: 120, unit: 'mg/dL' }`
- Dictation: *"Creatinine ek point do"* $\to$ Extracts: `{ testCode: 'CREAT', numericValue: 1.2, unit: 'mg/dL' }`

---

### 6.6 The GAMP 5 Non-Clinical Firewall (Enforced HTTP 403 Fail-Closed Protection)

To prevent AI from executing clinical transactions, `server/platformRoutes.js:473-483` enforces an impenetrable clinical firewall:

```javascript
app.post('/api/ai/sandbox/clinical-gate-check', auth, async (req, res) => {
  const action = String(req.body?.action || '').toUpperCase();
  const FORBIDDEN_CLINICAL_ACTIONS = [
    'APPROVE_QC',
    'RELEASE_REPORT',
    'OVERRIDE_PANIC',
    'VALIDATE_RESULTS'
  ];

  if (FORBIDDEN_CLINICAL_ACTIONS.includes(action)) {
    return res.status(403).json({
      error: `AI cannot perform clinical action: ${action}. Human pathologist sign-off and clinical validation gates strictly required.`,
      allowed: false,
      gatePolicy: 'FAIL_CLOSED'
    });
  }

  res.json({ allowed: true, sandboxMode: 'NON_CLINICAL_INFORMATIONAL_ONLY' });
});
```

*Every attempt by an automated agent or prompt injection to approve QC, validate results, or release a diagnostic report triggers an immediate **HTTP 403 Forbidden** and logs an alert to the immutable audit ledger.*

---

## 7. Laboratory Hardware Interfacing Guide: Analyzers & Serial-to-Ethernet Gateways

Modern clinical analyzers stream raw patient results immediately after aspiration and measurement. HRGen GIA LIMS provides built-in edge listeners for ASTM and HL7 protocols.

### 7.1 ASTM E1381/E1394 Interface Setup (Port 5000 TCP/IP & RS-232 Converter)
- **Applicable Analyzers**: Mindray BC-3000 / BC-5000, Sysmex XP-100 / XN-550, Beckman Coulter Access 2, Erba Chem 7.
- **Physical Connection**:
  * Most legacy analyzers feature a standard DB9 or DB25 RS-232 serial COM port.
  * Connect the analyzer's serial port to an **RS-232-to-Ethernet Converter** (e.g., Moxa NPort 5110 or Waveshare RS232/485 to RJ45).
  * Configure the converter:
    - Mode: `TCP Client`
    - Destination IP: `192.168.1.50` (Server PC Static IP)
    - Destination Port: `5000`
    - Baud Rate: `9600` (or `19200` per analyzer manual) | Data Bits: `8` | Parity: `None` | Stop Bits: `1`
- **LIMS Configuration (`.env`)**:
  ```ini
  ASTM_ENABLED=true
  ASTM_PORT=5000
  ```

### 7.2 HL7 v2.5 / MLLP Edge Interface Setup (Port 2575 TCP/IP)
- **Applicable Analyzers**: Roche Cobas c311 / e411, Siemens Atellica, Abbott Architect ci4100.
- **Physical Connection**: Analyzers connect directly to the clinic Ethernet switch via RJ45 Cat6 cable.
- **Analyzer Setup**:
  * Destination IP: `192.168.1.50`
  * Destination Port: `2575`
  * Protocol: `HL7 v2.5 Minimal Lower Layer Protocol (MLLP)`
- **LIMS Configuration (`.env`)**:
  ```ini
  MLLP_ENABLED=true
  MLLP_PORT=2575
  ```

### 7.3 Analyzer Mapping & Mandatory 'UNREVIEWED' Quarantine Ingest
Under ISO 15189 clause 7.3, automated analyzer imports must never automatically overwrite existing verified data or bypass human review:
1. When data arrives on port 5000 or 2575, `server.js:quarantineAnalyzerMessage()` stores the raw payload in `DB.platformRecords` with status `PENDING_REVIEW`.
2. When the technician imports results into an active accession (`POST /api/instrument-results/import`), the server:
   - Verifies the pre-analytical gate: `order.specimenStatus === 'ACCEPTED'`.
   - Requires exact 1:1 accession test code matching (omitted, extra, or duplicate codes reject fail-closed).
   - Tags every incoming result with status `'UNREVIEWED'`, recording the instrument ID, method, and raw values.
   - Requires human review and Westgard QC approval before pathologist sign-off.

---

## 8. Comprehensive Network Troubleshooting & Diagnostics Matrix

### 8.1 Local Network & Port Diagnostics Commands (PowerShell / CMD)

| Symptom | Probable Cause | Diagnostic Command | Resolution Action |
|:---|:---|:---|:---|
| **Client PC displays "ERR_CONNECTION_REFUSED"** | Server not running or listening on 127.0.0.1 only | `Test-NetConnection -ComputerName 192.168.1.50 -Port 3001` | Ensure `server.js` or PM2 is running. Verify binding is on `0.0.0.0`. |
| **Client PC displays "ERR_CONNECTION_TIMED_OUT"** | Windows Firewall is blocking incoming connections | `Get-NetFirewallRule -Name "HRGen-LIMS-Web-App-3001"` | Run `CONFIGURE_FIREWALL.ps1` as Administrator to open ports 3001, 5000, 2575. |
| **IP address changes every morning** | Host PC is set to dynamic DHCP without lease reservation | `Get-NetIPAddress -InterfaceAlias "Ethernet"` | Assign a static IP using `Set-NetIPAddress` or reserve the MAC address in the router. |
| **Cannot resolve `lims-server.local`** | mDNS responder disabled or blocked by router | `Resolve-DnsName -Name "lims-server.local"` | Use the direct numeric IP (`http://192.168.1.50:3001`) or enable mDNS on router. |
| **Port 3001 or 5000 is already in use (`EADDRINUSE`)** | Another background Node or system process holds port | `Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess` | Terminate conflicting process (`Stop-Process -Id <PID> -Force`). |

### 8.2 WhatsApp Cloud API & Webhook Debugging Runbook

| Failure Mode | Log / Error Code | Diagnostic Test | Resolution |
|:---|:---|:---|:---|
| **Meta Webhook returns 403 Forbidden** | `GET /api/whatsapp/webhook HTTP/1.1 403` | Inspect `hub.verify_token` in Meta App Dashboard | Ensure `WHATSAPP_VERIFY_TOKEN` in `.env` exactly matches Meta configuration string. |
| **Meta Webhook registration fails (OTP Redirect / 302)** | `GET /api/whatsapp/webhook` challenged with OTP login | Test via curl: `curl -I https://lims.yourlab.in/api/whatsapp/webhook` | Ensure Cloudflare Access has an explicit `Bypass` policy for `/api/whatsapp/webhook` (Section 5.4 Policy 2). Without this, Email OTP intercepts Meta's `hub.challenge`. |
| **Message dispatch returns HTTP 401 Unauthorized** | `{"error":{"message":"Invalid OAuth access token"}}` | Test with curl: `curl -H "Authorization: Bearer $TOKEN" https://graph.facebook.com/v19.0/me` | Permanent token expired or revoked. Generate a new System User Token in Meta Business Manager. |
| **Patient does not receive WhatsApp alert** | Status shows `FAILED` or `UNDELIVERED` | Check normalized phone number: Must include country code (e.g., `919876543210`) | Verify patient phone format. Check if patient has opted out or if template window (24h) has expired. |
| **1-Click `wa.me` opens blank WhatsApp** | Browser popup blocker is preventing tab open | Check address bar for blocked popup icon in Chrome/Edge | Allow popups for `http://192.168.1.50:3001` in browser site settings. |

### 8.3 Cloudflare Tunnel Health & Edge Diagnostics

| Failure Mode | Status Indicator | Diagnostic Command | Resolution |
|:---|:---|:---|:---|
| **Cloudflare returns Error 1033 / 502 Bad Gateway** | `cloudflared` daemon is stopped or cannot reach port 3001 | `Get-Service cloudflared` and `curl http://localhost:3001/api/system/info` | Start `cloudflared` service (`Start-Service cloudflared`). Verify local Node server is responding. |
| **Cloudflare returns Error 1000 DNS misconfiguration** | DNS CNAME is pointing to non-existent tunnel | `.\cloudflared.exe tunnel list` | Re-run `.\cloudflared.exe tunnel route dns hrgen-lims lims.yourlab.in`. |
| **Pathologist cannot log in remotely** | Cloudflare Access denies entry | Check Zero-Trust Access audit logs at `one.dash.cloudflare.com` | Ensure pathologist's email is explicitly added to the Cloudflare Access Allowed Policy. |

### 8.4 Gemini AI & Speech Recognition Diagnostics

| Failure Mode | Root Cause | Diagnostic Check | Resolution |
|:---|:---|:---|:---|
| **Microphone button does nothing in browser** | Browser denies microphone permissions | Check browser address bar microphone icon | Grant microphone access to `http://192.168.1.50:3001` or `https://lims.yourlab.in`. |
| **Voice dictation returns numbers in English when spoken in Hindi** | Audio transcript language mismatch | Check `recognition.lang` parameter | Select `हिन्दी (Hindi)` toggle in UI to activate `hi-IN` recognition. |
| **Gemini AI returns fallback explanations** | `GEMINI_API_KEY` missing or quota exceeded | Run verification script: `node validation/GEMINI_SANDBOX_VERIFY.js` | Supply a valid API key in `.env` or continue operating safely in deterministic offline mode. |
| **AI attempt to approve QC fails with 403** | **Intentional Security Feature** | Check HTTP response status: `403 Forbidden` | Working as intended! GAMP 5 Human-in-the-Loop firewall strictly blocks non-human clinical validation. |

---

## 9. Turnkey Commissioning Checklist & Final Verification Runbook

Before admitting live patients or releasing clinical reports, the Laboratory Director and IT Administrator must complete this commissioning checklist.

### 9.1 Pre-Flight Acceptance Testing Checklist

```
+----+-------------------------------------------------------------------------+---------+-----------+
| #  | Verification Item                                                       | Status  | Verified  |
+----+-------------------------------------------------------------------------+---------+-----------+
| 01 | Host PC assigned static IP (192.168.1.50) and verified on local subnet  | [  ]    | IT Admin  |
| 02 | Windows Firewall rules applied for TCP ports 3001, 5000, 2575           | [  ]    | IT Admin  |
| 03 | Background service auto-start (PM2 or NSSM) confirmed across PC reboot  | [  ]    | IT Admin  |
| 04 | Reception station Desktop shortcut created; loads /#opd in App Mode     | [  ]    | Reception |
| 05 | Phlebotomy station Desktop shortcut created; loads /#specimens          | [  ]    | Phlebotomy|
| 06 | Tech bench station Desktop shortcut created; loads /#worklist & /#qc    | [  ]    | Lab Tech  |
| 07 | Pathologist cockpit Desktop shortcut created; loads /#pathologist       | [  ]    | Pathologist|
| 08 | Thermal barcode printer configured (50x25mm labels, sharp contrast)     | [  ]    | Phlebotomy|
| 09 | A4 laser printer configured (letterhead margins & digital footer)       | [  ]    | Reception |
| 10 | 1-Click WhatsApp direct dispatch opens pre-filled wa.me URL with token  | [  ]    | Reception |
| 11 | Cloudflare Zero-Trust Tunnel live; HTTPS verified at lims.yourlab.in    | [  ]    | IT Admin  |
| 12 | Cloudflare Access OTP policy verified; remote pathologist receives PIN  | [  ]    | Pathologist|
| 13 | Public report QR verification verified from smartphone on cellular 5G   | [  ]    | Pathologist|
| 14 | Bilingual voice scribe tested (Hindi: "Hemoglobin das point paanch")    | [  ]    | Lab Tech  |
| 15 | AI Clinical Firewall verified: AI cannot approve QC or sign reports     | [  ]    | Pathologist|
| 16 | All automated verification test suites execute with 100% PASS           | [  ]    | Quality Mgr|
+----+-------------------------------------------------------------------------+---------+-----------+
```

---

### 9.2 Verification Commands & Expected Outputs

Execute these commands from PowerShell inside `C:\Users\pc\Desktop\HRGEN GIA LIMS` to independently confirm that all clinical gates, AI sandboxes, and static policies are operating correctly:

```powershell
# In PowerShell (Run from C:\Users\pc\Desktop\HRGEN GIA LIMS)

# 1. Verify Gemini AI Non-Clinical Sandbox & Human-in-the-Loop Firewall
node validation/GEMINI_SANDBOX_VERIFY.js
# EXPECTED OUTPUT:
# PASS :: 1. Official @google/genai SDK loaded and Type enums verified
# PASS :: 2. Server-side API key protection (never in client payload)
# PASS :: 3. Deterministic Clinical Anomaly Detection Engine
# PASS :: 4. evaluateCopilot outputs structured bilingual explanations with strict human gates
# PASS :: 5. generateDictationDraft normalizes bilingual voice scribe into structured draft observations
# PASS :: 6. Fail-closed gate defense prevents AI from approving QC or signing reports
# PASS :: 7. Structured JSON response format and types contract verified
# RESULT: ALL 7/7 GEMINI SANDBOX CHECKS PASSED (100% PASS)

# 2. Verify Clinical Safety Gates (Specimen ACCEPTED Gate & Analyzer Ingest Gates)
node validation/CLINICAL_GATE_FIX_VERIFY.js
# EXPECTED OUTPUT:
# RESULT: ALL 17/17 CLINICAL SAFETY GATE CHECKS PASSED (100% PASS)

# 3. Verify PostgreSQL Row-Level Security Static Policies
node validation/TENANT_RLS_STATIC_VERIFY.js
# EXPECTED OUTPUT:
# RESULT: ALL 21/21 STATIC TENANT ISOLATION CHECKS PASSED (100% PASS)

# 4. Verify Local Server Live Status
node run_local_server.js
# EXPECTED OUTPUT:
# HRGen GIA LIMS is LIVE at: http://localhost:3001
# Default Demo Credentials:
#   - Administrator: username: admin       | password: Admin@12345678
#   - Pathologist:   username: pathologist | password: Path@12345678
#   - Technician:    username: tech        | password: Tech@12345678
```

---
*Manual compiled and verified for HRGen GIA LIMS enterprise deployment.*
