/*
  HAVEN Arduino Uno R4 WiFi receiver

  Companion firmware for the HAVEN prototype described on the portfolio site.
  This sketch:
    - advertises a BLE characteristic for haptic commands
    - accepts either five raw bytes or a CSV string such as "0,0,25,75,0"
    - routes the five intensity values through a TCA9548A / Qwiic multiplexer
    - drives five DRV2605L boards in real-time playback mode

  Expected intensity range:
    0..100 for each motor

  Hardware:
    - Arduino Uno R4 WiFi
    - SparkFun Qwiic Mux Breakout (TCA9548A)
    - 5x DRV2605L haptic drivers
    - 5x ERM tactors

  Libraries:
    - ArduinoBLE
    - Adafruit DRV2605 Library

  Note:
    The BLE service and characteristic UUIDs in this sketch are the expected
    values for this bundled demo receiver. If your iPhone app uses different
    UUIDs inside its BLE manager, update both sides so they match before
    flashing the board.
*/

#include <ArduinoBLE.h>
#include <Wire.h>
#include <Adafruit_DRV2605.h>
#include <ctype.h>
#include <stdio.h>
#include <string.h>

constexpr uint8_t K_MUX_ADDRESS = 0x70;
constexpr size_t K_MOTOR_COUNT = 5;
constexpr uint8_t K_MAX_RTP_VALUE = 110;
constexpr char K_DEVICE_NAME[] = "HAVEN-Haptics";

BLEService hapticService("9d5e5bce-8c5e-4a6a-9f64-0f3b8349d101");
BLECharacteristic hapticCharacteristic(
  "9d5e5bce-8c5e-4a6a-9f64-0f3b8349d102",
  BLEWrite | BLEWriteWithoutResponse,
  32
);

Adafruit_DRV2605 drivers[K_MOTOR_COUNT];
uint8_t lastLevels[K_MOTOR_COUNT] = {0, 0, 0, 0, 0};
bool driverReady[K_MOTOR_COUNT] = {false, false, false, false, false};

void selectMuxChannel(uint8_t channel) {
  if (channel >= K_MOTOR_COUNT) {
    return;
  }

  Wire.beginTransmission(K_MUX_ADDRESS);
  Wire.write(1 << channel);
  Wire.endTransmission();
}

bool initDriver(uint8_t index) {
  selectMuxChannel(index);
  if (!drivers[index].begin()) {
    return false;
  }

  drivers[index].selectLibrary(1);
  drivers[index].setMode(DRV2605_MODE_REALTIME);
  driverReady[index] = true;
  return true;
}

uint8_t intensityToRealtime(uint8_t level) {
  level = constrain(level, 0, 100);
  return map(level, 0, 100, 0, K_MAX_RTP_VALUE);
}

bool looksLikeCsv(const uint8_t *buffer, int length) {
  for (int i = 0; i < length; ++i) {
    char c = static_cast<char>(buffer[i]);
    if (!(isdigit(c) || c == ',' || c == ' ' || c == '\n' || c == '\r' || c == '\t' || c == '-')) {
      return false;
    }
  }
  return true;
}

bool parseCsvPayload(const uint8_t *buffer, int length, uint8_t *levelsOut) {
  char text[33];
  int safeLength = min(length, 32);
  memcpy(text, buffer, safeLength);
  text[safeLength] = '\0';

  int parsed[K_MOTOR_COUNT] = {0, 0, 0, 0, 0};
  int matched = sscanf(
    text,
    "%d,%d,%d,%d,%d",
    &parsed[0],
    &parsed[1],
    &parsed[2],
    &parsed[3],
    &parsed[4]
  );

  if (matched != static_cast<int>(K_MOTOR_COUNT)) {
    return false;
  }

  for (size_t i = 0; i < K_MOTOR_COUNT; ++i) {
    levelsOut[i] = static_cast<uint8_t>(constrain(parsed[i], 0, 100));
  }
  return true;
}

void applyLevels(const uint8_t *levels) {
  for (size_t i = 0; i < K_MOTOR_COUNT; ++i) {
    lastLevels[i] = levels[i];
    if (!driverReady[i] && !initDriver(i)) {
      continue;
    }

    selectMuxChannel(i);
    drivers[i].setRealtimeValue(intensityToRealtime(levels[i]));
  }
}

void stopAllMotors() {
  uint8_t zeros[K_MOTOR_COUNT] = {0, 0, 0, 0, 0};
  applyLevels(zeros);
}

void setup() {
  Serial.begin(115200);
  Wire.begin();

  for (uint8_t i = 0; i < K_MOTOR_COUNT; ++i) {
    initDriver(i);
  }

  if (!BLE.begin()) {
    Serial.println("BLE failed to start.");
    while (true) {
      delay(1000);
    }
  }

  BLE.setLocalName(K_DEVICE_NAME);
  BLE.setDeviceName(K_DEVICE_NAME);
  BLE.setAdvertisedService(hapticService);
  hapticService.addCharacteristic(hapticCharacteristic);
  BLE.addService(hapticService);
  hapticCharacteristic.writeValue(lastLevels, K_MOTOR_COUNT);
  BLE.advertise();

  Serial.println("HAVEN haptic receiver is advertising over BLE.");
}

void loop() {
  BLE.poll();

  BLEDevice central = BLE.central();
  if (!central) {
    delay(5);
    return;
  }

  Serial.print("Connected to central: ");
  Serial.println(central.address());

  while (central.connected()) {
    BLE.poll();

    if (hapticCharacteristic.written()) {
      int length = hapticCharacteristic.valueLength();
      uint8_t buffer[32] = {0};
      hapticCharacteristic.readValue(buffer, length);

      uint8_t levels[K_MOTOR_COUNT] = {0, 0, 0, 0, 0};
      bool parsed = false;

      if (looksLikeCsv(buffer, length)) {
        parsed = parseCsvPayload(buffer, length, levels);
      } else if (length >= static_cast<int>(K_MOTOR_COUNT)) {
        for (size_t i = 0; i < K_MOTOR_COUNT; ++i) {
          levels[i] = constrain(buffer[i], 0, 100);
        }
        parsed = true;
      }

      if (parsed) {
        applyLevels(levels);
      }
    }

    delay(5);
  }

  Serial.println("Central disconnected.");
  stopAllMotors();
}
