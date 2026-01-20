import { ref, computed } from 'vue'

// Conversion factors to base unit for each category
const conversions = {
  length: {
    name: 'Longitud',
    icon: 'M6 6h.01M6 18h.01M18 6h.01M18 18h.01M3 12h18',
    baseUnit: 'm',
    units: {
      mm: { name: 'Milímetro', symbol: 'mm', factor: 0.001 },
      cm: { name: 'Centímetro', symbol: 'cm', factor: 0.01 },
      m: { name: 'Metro', symbol: 'm', factor: 1 },
      km: { name: 'Kilómetro', symbol: 'km', factor: 1000 },
      inch: { name: 'Pulgada', symbol: 'in', factor: 0.0254 },
      foot: { name: 'Pie', symbol: 'ft', factor: 0.3048 },
      yard: { name: 'Yarda', symbol: 'yd', factor: 0.9144 },
      mile: { name: 'Milla', symbol: 'mi', factor: 1609.344 },
      nautical: { name: 'Milla náutica', symbol: 'nmi', factor: 1852 }
    }
  },
  weight: {
    name: 'Peso',
    icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    baseUnit: 'kg',
    units: {
      mg: { name: 'Miligramo', symbol: 'mg', factor: 0.000001 },
      g: { name: 'Gramo', symbol: 'g', factor: 0.001 },
      kg: { name: 'Kilogramo', symbol: 'kg', factor: 1 },
      ton: { name: 'Tonelada', symbol: 't', factor: 1000 },
      oz: { name: 'Onza', symbol: 'oz', factor: 0.0283495 },
      lb: { name: 'Libra', symbol: 'lb', factor: 0.453592 },
      stone: { name: 'Stone', symbol: 'st', factor: 6.35029 }
    }
  },
  temperature: {
    name: 'Temperatura',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    baseUnit: 'c',
    units: {
      c: { name: 'Celsius', symbol: '°C', factor: null },
      f: { name: 'Fahrenheit', symbol: '°F', factor: null },
      k: { name: 'Kelvin', symbol: 'K', factor: null }
    },
    convert: (value, from, to) => {
      // Convert to Celsius first
      let celsius
      if (from === 'c') celsius = value
      else if (from === 'f') celsius = (value - 32) * 5/9
      else if (from === 'k') celsius = value - 273.15

      // Convert from Celsius to target
      if (to === 'c') return celsius
      else if (to === 'f') return celsius * 9/5 + 32
      else if (to === 'k') return celsius + 273.15
    }
  },
  area: {
    name: 'Área',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z',
    baseUnit: 'm2',
    units: {
      mm2: { name: 'Milímetro²', symbol: 'mm²', factor: 0.000001 },
      cm2: { name: 'Centímetro²', symbol: 'cm²', factor: 0.0001 },
      m2: { name: 'Metro²', symbol: 'm²', factor: 1 },
      km2: { name: 'Kilómetro²', symbol: 'km²', factor: 1000000 },
      hectare: { name: 'Hectárea', symbol: 'ha', factor: 10000 },
      acre: { name: 'Acre', symbol: 'ac', factor: 4046.86 },
      ft2: { name: 'Pie²', symbol: 'ft²', factor: 0.092903 },
      in2: { name: 'Pulgada²', symbol: 'in²', factor: 0.00064516 }
    }
  },
  volume: {
    name: 'Volumen',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    baseUnit: 'l',
    units: {
      ml: { name: 'Mililitro', symbol: 'ml', factor: 0.001 },
      l: { name: 'Litro', symbol: 'l', factor: 1 },
      m3: { name: 'Metro³', symbol: 'm³', factor: 1000 },
      gallon: { name: 'Galón (US)', symbol: 'gal', factor: 3.78541 },
      quart: { name: 'Cuarto (US)', symbol: 'qt', factor: 0.946353 },
      pint: { name: 'Pinta (US)', symbol: 'pt', factor: 0.473176 },
      cup: { name: 'Taza (US)', symbol: 'cup', factor: 0.236588 },
      floz: { name: 'Onza fluida (US)', symbol: 'fl oz', factor: 0.0295735 },
      tbsp: { name: 'Cucharada', symbol: 'tbsp', factor: 0.0147868 },
      tsp: { name: 'Cucharadita', symbol: 'tsp', factor: 0.00492892 }
    }
  },
  time: {
    name: 'Tiempo',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    baseUnit: 's',
    units: {
      ms: { name: 'Milisegundo', symbol: 'ms', factor: 0.001 },
      s: { name: 'Segundo', symbol: 's', factor: 1 },
      min: { name: 'Minuto', symbol: 'min', factor: 60 },
      hour: { name: 'Hora', symbol: 'h', factor: 3600 },
      day: { name: 'Día', symbol: 'd', factor: 86400 },
      week: { name: 'Semana', symbol: 'sem', factor: 604800 },
      month: { name: 'Mes (30d)', symbol: 'mes', factor: 2592000 },
      year: { name: 'Año (365d)', symbol: 'año', factor: 31536000 }
    }
  },
  speed: {
    name: 'Velocidad',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    baseUnit: 'ms',
    units: {
      ms: { name: 'Metro/segundo', symbol: 'm/s', factor: 1 },
      kmh: { name: 'Kilómetro/hora', symbol: 'km/h', factor: 0.277778 },
      mph: { name: 'Milla/hora', symbol: 'mph', factor: 0.44704 },
      knot: { name: 'Nudo', symbol: 'kn', factor: 0.514444 },
      fts: { name: 'Pie/segundo', symbol: 'ft/s', factor: 0.3048 }
    }
  },
  data: {
    name: 'Datos',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    baseUnit: 'byte',
    units: {
      bit: { name: 'Bit', symbol: 'bit', factor: 0.125 },
      byte: { name: 'Byte', symbol: 'B', factor: 1 },
      kb: { name: 'Kilobyte', symbol: 'KB', factor: 1024 },
      mb: { name: 'Megabyte', symbol: 'MB', factor: 1048576 },
      gb: { name: 'Gigabyte', symbol: 'GB', factor: 1073741824 },
      tb: { name: 'Terabyte', symbol: 'TB', factor: 1099511627776 },
      pb: { name: 'Petabyte', symbol: 'PB', factor: 1125899906842624 }
    }
  },
  pressure: {
    name: 'Presión',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    baseUnit: 'pa',
    units: {
      pa: { name: 'Pascal', symbol: 'Pa', factor: 1 },
      kpa: { name: 'Kilopascal', symbol: 'kPa', factor: 1000 },
      bar: { name: 'Bar', symbol: 'bar', factor: 100000 },
      atm: { name: 'Atmósfera', symbol: 'atm', factor: 101325 },
      psi: { name: 'PSI', symbol: 'psi', factor: 6894.76 },
      mmhg: { name: 'mmHg', symbol: 'mmHg', factor: 133.322 },
      torr: { name: 'Torr', symbol: 'Torr', factor: 133.322 }
    }
  },
  energy: {
    name: 'Energía',
    icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
    baseUnit: 'j',
    units: {
      j: { name: 'Julio', symbol: 'J', factor: 1 },
      kj: { name: 'Kilojulio', symbol: 'kJ', factor: 1000 },
      cal: { name: 'Caloría', symbol: 'cal', factor: 4.184 },
      kcal: { name: 'Kilocaloría', symbol: 'kcal', factor: 4184 },
      wh: { name: 'Vatio-hora', symbol: 'Wh', factor: 3600 },
      kwh: { name: 'Kilovatio-hora', symbol: 'kWh', factor: 3600000 },
      btu: { name: 'BTU', symbol: 'BTU', factor: 1055.06 },
      ev: { name: 'Electronvoltio', symbol: 'eV', factor: 1.60218e-19 }
    }
  },
  power: {
    name: 'Potencia',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    baseUnit: 'w',
    units: {
      w: { name: 'Vatio', symbol: 'W', factor: 1 },
      kw: { name: 'Kilovatio', symbol: 'kW', factor: 1000 },
      mw: { name: 'Megavatio', symbol: 'MW', factor: 1000000 },
      hp: { name: 'Caballo de fuerza', symbol: 'HP', factor: 745.7 },
      cv: { name: 'Caballo de vapor', symbol: 'CV', factor: 735.499 },
      btuh: { name: 'BTU/hora', symbol: 'BTU/h', factor: 0.293071 }
    }
  },
  angle: {
    name: 'Ángulo',
    icon: 'M4 20h16M4 20l8-16 8 16M8 14h8',
    baseUnit: 'deg',
    units: {
      deg: { name: 'Grado', symbol: '°', factor: 1 },
      rad: { name: 'Radián', symbol: 'rad', factor: 57.2958 },
      grad: { name: 'Gradián', symbol: 'gon', factor: 0.9 },
      arcmin: { name: 'Minuto de arco', symbol: "'", factor: 1/60 },
      arcsec: { name: 'Segundo de arco', symbol: '"', factor: 1/3600 },
      turn: { name: 'Vuelta', symbol: 'rev', factor: 360 }
    }
  },
  frequency: {
    name: 'Frecuencia',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',
    baseUnit: 'hz',
    units: {
      hz: { name: 'Hercio', symbol: 'Hz', factor: 1 },
      khz: { name: 'Kilohercio', symbol: 'kHz', factor: 1000 },
      mhz: { name: 'Megahercio', symbol: 'MHz', factor: 1000000 },
      ghz: { name: 'Gigahercio', symbol: 'GHz', factor: 1000000000 },
      rpm: { name: 'Rev/minuto', symbol: 'RPM', factor: 1/60 }
    }
  }
}

export function useUnitConverter() {
  const categories = ref(conversions)
  const selectedCategory = ref('length')
  const fromUnit = ref('m')
  const toUnit = ref('km')
  const inputValue = ref(1)

  // Currency state
  const currencyRates = ref({})
  const currencyLoading = ref(false)
  const currencyError = ref(null)
  const currencyLastUpdate = ref(null)

  const currentCategory = computed(() => {
    return categories.value[selectedCategory.value]
  })

  const availableUnits = computed(() => {
    return currentCategory.value?.units || {}
  })

  // Generic conversion function
  const convert = (value, from, to, category) => {
    if (!value || isNaN(value)) return 0

    const cat = categories.value[category]
    if (!cat) return 0

    // Special case for temperature
    if (category === 'temperature' && cat.convert) {
      return cat.convert(parseFloat(value), from, to)
    }

    // Standard factor-based conversion
    const fromFactor = cat.units[from]?.factor
    const toFactor = cat.units[to]?.factor

    if (!fromFactor || !toFactor) return 0

    // Convert to base unit, then to target
    const baseValue = parseFloat(value) * fromFactor
    return baseValue / toFactor
  }

  // Computed result
  const result = computed(() => {
    return convert(inputValue.value, fromUnit.value, toUnit.value, selectedCategory.value)
  })

  // Convert to all units in category
  const allConversions = computed(() => {
    const results = []
    const units = availableUnits.value

    for (const [key, unit] of Object.entries(units)) {
      const converted = convert(inputValue.value, fromUnit.value, key, selectedCategory.value)
      results.push({
        key,
        name: unit.name,
        symbol: unit.symbol,
        value: converted
      })
    }

    return results
  })

  // Format number for display
  const formatNumber = (num) => {
    if (num === 0) return '0'
    if (Math.abs(num) < 0.000001 || Math.abs(num) > 999999999) {
      return num.toExponential(6)
    }
    // Remove trailing zeros
    return parseFloat(num.toPrecision(10)).toString()
  }

  // Swap units
  const swapUnits = () => {
    const temp = fromUnit.value
    fromUnit.value = toUnit.value
    toUnit.value = temp
  }

  // Change category
  const setCategory = (category) => {
    selectedCategory.value = category
    const units = Object.keys(categories.value[category].units)
    fromUnit.value = units[0]
    toUnit.value = units[1] || units[0]
    inputValue.value = 1
  }

  // Fetch currency rates
  const fetchCurrencyRates = async () => {
    currencyLoading.value = true
    currencyError.value = null

    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=EUR')
      const data = await response.json()

      // Add EUR to rates
      currencyRates.value = { EUR: 1, ...data.rates }
      currencyLastUpdate.value = data.date

      // Add currency category dynamically
      const currencyUnits = {}
      const currencyNames = {
        EUR: 'Euro', USD: 'Dólar estadounidense', GBP: 'Libra esterlina',
        JPY: 'Yen japonés', CHF: 'Franco suizo', CAD: 'Dólar canadiense',
        AUD: 'Dólar australiano', NZD: 'Dólar neozelandés', CNY: 'Yuan chino',
        INR: 'Rupia india', MXN: 'Peso mexicano', BRL: 'Real brasileño',
        KRW: 'Won surcoreano', SEK: 'Corona sueca', NOK: 'Corona noruega',
        DKK: 'Corona danesa', PLN: 'Zloty polaco', CZK: 'Corona checa',
        HUF: 'Forinto húngaro', RON: 'Leu rumano', BGN: 'Lev búlgaro',
        HRK: 'Kuna croata', ISK: 'Corona islandesa', TRY: 'Lira turca',
        ZAR: 'Rand sudafricano', HKD: 'Dólar de Hong Kong', SGD: 'Dólar de Singapur',
        THB: 'Baht tailandés', MYR: 'Ringgit malasio', IDR: 'Rupia indonesia',
        PHP: 'Peso filipino', ILS: 'Nuevo séquel israelí'
      }

      for (const [code, rate] of Object.entries(currencyRates.value)) {
        currencyUnits[code.toLowerCase()] = {
          name: currencyNames[code] || code,
          symbol: code,
          factor: rate
        }
      }

      categories.value = {
        ...conversions,
        currency: {
          name: 'Moneda',
          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          baseUnit: 'eur',
          units: currencyUnits
        }
      }
    } catch (error) {
      currencyError.value = 'Error al cargar las tasas de cambio'
      console.error('Currency fetch error:', error)
    } finally {
      currencyLoading.value = false
    }
  }

  // Convert currency
  const convertCurrency = (value, from, to) => {
    if (!currencyRates.value[from.toUpperCase()] || !currencyRates.value[to.toUpperCase()]) {
      return 0
    }

    const fromRate = currencyRates.value[from.toUpperCase()]
    const toRate = currencyRates.value[to.toUpperCase()]

    // Convert through EUR (base)
    const eurValue = parseFloat(value) / fromRate
    return eurValue * toRate
  }

  return {
    categories,
    selectedCategory,
    currentCategory,
    availableUnits,
    fromUnit,
    toUnit,
    inputValue,
    result,
    allConversions,
    convert,
    formatNumber,
    swapUnits,
    setCategory,
    // Currency
    currencyRates,
    currencyLoading,
    currencyError,
    currencyLastUpdate,
    fetchCurrencyRates,
    convertCurrency
  }
}
