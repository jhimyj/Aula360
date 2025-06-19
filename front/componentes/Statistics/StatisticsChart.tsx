import { View, Text, StyleSheet } from "react-native"
import { PieChart, BarChart, LineChart } from "react-native-chart-kit"

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
}

export const StatisticsChart = ({ type, data, width, height }) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <View style={[styles.noDataContainer, { width, height }]}>
        <Text style={styles.noDataText}>No hay datos suficientes</Text>
      </View>
    )
  }

  switch (type) {
    case "pie":
      return (
        <PieChart
          data={data}
          width={width}
          height={height}
          chartConfig={chartConfig}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      )

    case "bar":
      return (
        <BarChart
          data={data}
          width={width}
          height={height}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            ...chartConfig,
            barPercentage: 0.6,
            propsForLabels: {
              fontSize: 10,
            },
          }}
          verticalLabelRotation={30}
          showValuesOnTopOfBars
        />
      )

    case "line":
      return (
        <LineChart
          data={data}
          width={width}
          height={height}
          chartConfig={{
            ...chartConfig,
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#4361EE",
            },
          }}
          bezier
        />
      )

    default:
      return (
        <View style={[styles.noDataContainer, { width, height }]}>
          <Text style={styles.noDataText}>Tipo de gráfico no soportado</Text>
        </View>
      )
  }
}

const styles = StyleSheet.create({
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#999",
  },
})
