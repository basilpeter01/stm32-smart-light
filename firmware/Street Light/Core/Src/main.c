
/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Smart Street Light - LDR + PIR + LED
  ******************************************************************************
  */
/* USER CODE END Header */

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "adc.h"
#include "tim.h"
#include "usart.h"
#include "gpio.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
/* USER CODE END Includes */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */
#define LDR_THRESHOLD       2000
#define NODE_ID             "LIGHT_01"
#define LOG_INTERVAL_MS     3000
#define LED_ON_DURATION_MS  5000
/* USER CODE END PD */

/* Private variables ---------------------------------------------------------*/
/* USER CODE BEGIN PV */
uint32_t ldr_value = 0;
uint8_t pir_status = 0;
char uart_buffer[128];

uint32_t last_log_tick = 0;
uint32_t led_on_tick = 0;

bool led_timing_active = false;
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);

/* USER CODE BEGIN PFP */
void UART_Print(char *message);
void Print_Telemetry(void);
/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

void UART_Print(char *message)
{
    HAL_UART_Transmit(&huart2,
                      (uint8_t *)message,
                      strlen(message),
                      HAL_MAX_DELAY);
}


/* Print JSON telemetry */
void Print_Telemetry(void)
{
    bool light_status =
        (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_5) == GPIO_PIN_SET);

    snprintf(uart_buffer, sizeof(uart_buffer),
             "{\r\n"
             "  \"device_id\": \"%s\",\r\n"
             "  \"light_status\": %s,\r\n"
             "  \"ldr_value\": %lu,\r\n"
             "  \"motion_detected\": %s\r\n"
             "}\r\n",
             NODE_ID,
             light_status ? "true" : "false",
             (unsigned long)ldr_value,
             (pir_status == GPIO_PIN_SET) ? "true" : "false");

    UART_Print(uart_buffer);
}

/* USER CODE END 0 */


/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
    /* Initialize HAL */
    HAL_Init();

    /* Configure system clock */
    SystemClock_Config();

    /* Initialize peripherals */
    MX_GPIO_Init();
    MX_USART2_UART_Init();
    MX_ADC1_Init();
    MX_TIM3_Init();

    /* USER CODE BEGIN 2 */

    UART_Print("\r\n====================================\r\n");
    UART_Print("     SMART STREET LIGHT SYSTEM\r\n");
    UART_Print("====================================\r\n");
    UART_Print("LDR + PIR + LED System Started\r\n");

    UART_Print("PIR Sensor Initializing...\r\n");

    /* Preserve original PIR stabilization time */
    HAL_Delay(30000);

    UART_Print("PIR Sensor Ready!\r\n");
    UART_Print("------------------------------------\r\n");

    /* Start the logging interval after initialization */
    last_log_tick = HAL_GetTick();

    /* USER CODE END 2 */


    /* Infinite loop */
    while (1)
    {
        /* 1. READ LDR SENSOR */
        HAL_ADC_Start(&hadc1);

        if (HAL_ADC_PollForConversion(&hadc1, 100) == HAL_OK)
        {
            ldr_value = HAL_ADC_GetValue(&hadc1);
        }

        HAL_ADC_Stop(&hadc1);


        /* 2. READ PIR SENSOR */
        pir_status = HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_0);


        /* 3. CONTROL LED WITHOUT BLOCKING THE MAIN LOOP */

        if (led_timing_active)
        {
            /*
             * LED has already been turned ON.
             * Keep it ON for the original 5-second duration.
             */
            if ((uint32_t)(HAL_GetTick() - led_on_tick)
                >= LED_ON_DURATION_MS)
            {
                HAL_GPIO_WritePin(GPIOA,
                                  GPIO_PIN_5,
                                  GPIO_PIN_RESET);

                led_timing_active = false;
            }
        }
        else
        {
            if ((ldr_value > LDR_THRESHOLD) &&
                (pir_status == GPIO_PIN_SET))
            {
                /* Dark + motion detected: LED ON */
                HAL_GPIO_WritePin(GPIOA,
                                  GPIO_PIN_5,
                                  GPIO_PIN_SET);

                led_on_tick = HAL_GetTick();
                led_timing_active = true;
            }
            else
            {
                /* Bright or no motion: LED OFF */
                HAL_GPIO_WritePin(GPIOA,
                                  GPIO_PIN_5,
                                  GPIO_PIN_RESET);
            }
        }


        /* 4. LOG JSON EVERY 3 SECONDS */
        if ((uint32_t)(HAL_GetTick() - last_log_tick)
            >= LOG_INTERVAL_MS)
        {
            last_log_tick = HAL_GetTick();

            Print_Telemetry();
        }


        /* 5. SHORT LOOP DELAY */
        HAL_Delay(20);
    }
}


/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
    RCC_OscInitTypeDef RCC_OscInitStruct = {0};
    RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

    __HAL_RCC_PWR_CLK_ENABLE();

    __HAL_PWR_VOLTAGESCALING_CONFIG(
        PWR_REGULATOR_VOLTAGE_SCALE3);

    RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
    RCC_OscInitStruct.HSIState = RCC_HSI_ON;
    RCC_OscInitStruct.HSICalibrationValue =
        RCC_HSICALIBRATION_DEFAULT;

    RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
    RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
    RCC_OscInitStruct.PLL.PLLM = 16;
    RCC_OscInitStruct.PLL.PLLN = 336;
    RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV4;
    RCC_OscInitStruct.PLL.PLLQ = 2;
    RCC_OscInitStruct.PLL.PLLR = 2;

    if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
    {
        Error_Handler();
    }

    RCC_ClkInitStruct.ClockType =
        RCC_CLOCKTYPE_HCLK |
        RCC_CLOCKTYPE_SYSCLK |
        RCC_CLOCKTYPE_PCLK1 |
        RCC_CLOCKTYPE_PCLK2;

    RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
    RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
    RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
    RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

    if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct,
                            FLASH_LATENCY_2) != HAL_OK)
    {
        Error_Handler();
    }
}


/**
  * @brief Error Handler
  * @retval None
  */
void Error_Handler(void)
{
    __disable_irq();

    while (1)
    {
    }
}


#ifdef USE_FULL_ASSERT

void assert_failed(uint8_t *file, uint32_t line)
{
    /* Add debugging output here if required */
}

#endif /* USE_FULL_ASSERT */
