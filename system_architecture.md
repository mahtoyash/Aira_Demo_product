# Serverless IoT Room Analytics System

## Project Overview

A high-speed, low-latency room monitoring system integrating real-time AI-driven people counting via 5GHz Wi-Fi 6 and environmental sensing (CO2) via a modular Bluetooth sub-node.

---

## System Architecture

The system is divided into three main layers.

### 1. Sensor Edge Node (Peripheral)

| Component | Detail |
|-----------|--------|
| MCU | ESP32 (Standard) |
| Sensor | SCD41 (Photoacoustic CO2 Sensor) |
| Communication | Bluetooth Low Energy (BLE) |

**Function:** Samples CO2, Temperature, and Humidity at 1-minute intervals. Transmits data packets to the Main Gateway via BLE to maintain physical modularity and reduce interference.

---

### 2. AI Gateway Node (Central)

| Component | Detail |
|-----------|--------|
| MCU | ESP32-C5 (Dual-band Wi-Fi 6 + RISC-V) |
| Camera | OV2640 (2MP) via PARLIO (Parallel IO) |
| Connectivity | 5GHz band (bypasses 2.4GHz congestion) |
| Stream | Stable 15 FPS |

**Role:** Primary gateway. Receives BLE data from the Sensor Node and captures raw JPEG frames from the camera.

---

### 3. Cloud Processing & Logic Layer

| Component | Detail |
|-----------|--------|
| Backend | FastAPI on Hugging Face Spaces (Serverless) |
| AI Model | YOLOv8-tiny (real-time human detection) |
| Database | Firebase Realtime Database |

**Pipeline:**
1. Gateway POSTs raw JPEG buffers to the Cloud API.
2. API performs In-Memory Inference (Process-and-Delete) to detect people.
3. "Tripwire" logic counts entries/exits at the door region.
4. Processed counts and CO2 telemetry are synced to Firebase.

---

## Data Pipeline Flow

**Capture:** ESP32-C5 captures JPEG frames at ~15 FPS at 320x240 (QVGA) resolution to balance detail and latency.

**Transmission:** Frames are sent over 5GHz Wi-Fi via `multipart/form-data` POST requests.

**Inference:** Cloud Python script receives the image, converts it to an OpenCV object, and runs YOLOv8 detection.

**Telemetry Merge:** Every 60 seconds, the C5 injects the latest SCD41 sensor data (received via Bluetooth) into the metadata stream.

**State Management:** Final "Room Occupancy" and "Air Quality" states are pushed to Firebase with a total end-to-end latency of under 2 seconds.

---

## Power Management

| Component | Detail |
|-----------|--------|
| Battery | 5000mAh - 10000mAh LiPo flat pack |
| Regulation | MT3608 DC-DC Boost Converter (stable 5V output) |
| Charging | TP4056 (Type-C) |
| Efficiency | ESP32-C5 Wi-Fi 6 TWT (Target Wake Time) for optimized power during high-bandwidth streaming |

---

## Hardware Requirements

| Component | Part |
|-----------|------|
| Main Controller | ESP32-C5 DevKit |
| Camera | OV2640 Module |
| Environment Sensor | SCD41 |
| Power | 10000mAh LiPo Battery + TP4056 Charger |
