# Hardware Pinout & Wiring Specification

This document details the hardware pin mapping, wiring diagram, and peripheral connections for the STM32-based Smart Street Light prototype (tested on **NUCLEO-F446RE** and compatible with **NUCLEO-F411RE**). A full visual schematic is available in [wiring-diagram.png](wiring-diagram.png).

---

## 1. Quick Reference Pinout Table

| Peripheral / Component | Module Pin | STM32 Pin | Arduino Header Pin | Morpho Pin | Peripheral Function | Electrical / Logic Level | Description / State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LDR Sensor Module** | **AO** (Analog Out) | **PA0** | CN8 Pin 1 (A0) | CN7 Pin 28 | `ADC1_IN0` | 0 – 3.3V Analog | 12-bit ADC (0–4095). Daylight < 2500, Night ≥ 2500 |
| | **DO** (Digital Out) | *NC* | — | — | Not Connected | — | Onboard comparator output unused |
| | **VCC** | **+5V** | CN6 Pin 5 (+5V) | CN7 Pin 18 | Power Rail | +5.0V DC | Power supply for sensor module |
| | **GND** | **GND** | CN6 Pin 6 (GND) | CN7 Pin 20 | Ground Rail | 0V | Common ground plane |
| **HC-SR501 PIR Sensor** | **OUT** | **PA1** | CN8 Pin 2 (A1) | CN7 Pin 30 | `GPIO_Input` | 3.3V TTL High / Low | Digital motion detection trigger (Retrigger mode) |
| | **VCC** | **+5V** | CN6 Pin 5 (+5V) | CN7 Pin 18 | Power Rail | +5.0V DC | Powers internal 7133 3.3V LDO regulator |
| | **GND** | **GND** | CN6 Pin 7 (GND) | CN7 Pin 22 | Ground Rail | 0V | Common ground plane |
| **Street Light LED** | **Anode (+)** | **PB4** | CN9 Pin 6 (D5) | CN10 Pin 27 | `TIM3_CH1` | 3.3V PWM | PWM duty cycle: 0% (Off), 20% (Dim), 100% (Full) |
| | **Cathode (-)** | **GND** | CN9 Pin 4 or Breadboard GND | CN10 Pin 20 | Ground via 220 Ω | 0V | In series with 220 Ω current-limiting resistor |
| **Serial Telemetry** | **ST-LINK TX** | **PA2** | CN9 Pin 2 (D1) | CN10 Pin 35 | `USART2_TX` | 3.3V UART (115200 baud) | Sends JSON telemetry to PC via ST-LINK USB |
| | **ST-LINK RX** | **PA3** | CN9 Pin 1 (D0) | CN10 Pin 37 | `USART2_RX` | 3.3V UART (115200 baud) | Onboard ST-LINK Virtual COM Port |

---

## 2. Text Wiring Diagram

```text
========================================================================================
                          NUCLEO-F446RE / F411RE PINOUT
========================================================================================

                 +---------------------------------------+
                 |            [Micro-USB Port]           |
                 |      (Power & USART2 ST-LINK VCP)     |
                 |                                       |
                 |      CN6 (Power)        CN5           |
                 |  [ 1] NC            [10] PB8 (D15)    |
                 |  [ 2] IOREF         [ 9] PB9 (D14)    |
                 |  [ 3] RESET         [ 8] AVDD         |
                 |  [ 4] +3.3V         [ 7] GND          |
   +5V Rail <-------[ 5] +5V           [ 6] PA5 (D13)    |
   GND Rail <-------[ 6] GND           [ 5] PA6 (D12)    |
   GND Rail <-------[ 7] GND           [ 4] PA7 (D11)    |
                 |  [ 8] VIN           [ 3] PB6 (D10)    |
                 |                     [ 2] PC7 (D9)     |
                 |      CN8 (Analog)   [ 1] PA9 (D8)     |
                 |                     CN9 (Digital)     |
    LDR AO  ------->[ 1] PA0 (A0)      [ 8] PA8 (D7)     |
    PIR OUT ------->[ 2] PA1 (A1)      [ 7] PB10 (D6)    |
                 |  [ 3] PA4 (A2)      [ 6] PB4 (D5)     |-------> LED Anode (+)
                 |  [ 4] PB0 (A3)      [ 5] PB5 (D4)     |         (TIM3_CH1 PWM)
                 |  [ 5] PC1 (A4)      [ 4] PB3 (D3)     |
                 |  [ 6] PC0 (A5)      [ 3] PA10 (D2)    |
                 |                     [ 2] PA2 (D1/TX)  |-------> (ST-LINK USB)
                 |                     [ 1] PA3 (D0/RX)  |-------> (ST-LINK USB)
                 +---------------------------------------+

```

---

## 3. Peripheral Details & Operating Modes

### A. Ambient Light Sensor (LDR Module)
- **Signal:** Analog Voltage (`0V` to `~3.3V`).
- **MCU Pin:** `PA0` mapped to internal `ADC1_IN0`.
- **ADC Configuration:** 12-bit resolution (`0` to `4095`).
- **Threshold Logic:**
  - Day: `ldr_value < 2500` (high ambient illumination)
  - Night: `ldr_value >= 2500` (low ambient illumination)

### B. Motion Sensor (HC-SR501 PIR)
- **Signal:** Digital Binary (`HIGH` = 3.3V, `LOW` = 0V).
- **MCU Pin:** `PA1` configured as standard GPIO Input with pull-down (`GPIO_NOPULL` or `GPIO_PULLDOWN`).
- **Power Requirement:** Even though the signal output is 3.3V logic (stepped down internally by its onboard 7133 regulator), the module supply `VCC` requires **+5V** to operate reliably.
- **Trigger Setting:** Jumper positioned to **H** (Repeat Trigger mode) so the signal remains `HIGH` as long as continuous motion is present.

### C. Street Light Output (LED Indicator)
- **Signal:** Pulse Width Modulation (PWM) driven by **Timer 3 Channel 1** on `PB4`.
- **Operating States:**
  - **Daytime (`ldr_value < 2500`):** `0%` duty cycle (Light completely OFF).
  - **Nighttime Idle (`ldr_value >= 2500`, motion `false`):** `20%` duty cycle (Dim conservation mode).
  - **Nighttime Active (`ldr_value >= 2500`, motion `true`):** `100%` duty cycle (Full illumination).
- **Protection:** 220 Ω series resistor limits current to safe levels (~8–10 mA) well within STM32 GPIO drive capability.
