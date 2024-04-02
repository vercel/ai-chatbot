export const responses = {
  listFlights: {
    arrival: 'SFO',
    departure: 'JFK',
    flights: [
      {
        id: 1,
        airlines: 'Cathay Pacific',
        departureTime: '11:00',
        arrivalTime: '14:00',
        price: 200
      },
      {
        id: 2,
        airlines: 'Lufthansa',
        departureTime: '15:00',
        arrivalTime: '18:00',
        price: 250
      },
      {
        id: 3,
        airlines: 'Cathay Pacific',
        departureTime: '19:00',
        arrivalTime: '22:00',
        price: 300
      }
    ]
  },
  showSeatPicker: {
    summary: {
      departingCity: 'San Francisco',
      arrivalCity: 'New York City',
      flightCode: 'BA123',
      date: '23 March 2024'
    }
  },
  showPurchaseFlight: {
    status: 'requires_confirmation',
    summary: {
      airline: 'American Airlines',
      departureTime: '10:00 AM',
      arrivalTime: '12:00 PM',
      price: 100,
      seat: '1A'
    }
  },
  showBoardingPass: {
    airline: 'American Airlines',
    arrival: 'SFO',
    departure: 'NYC',
    departureTime: '10:00 AM',
    arrivalTime: '12:00 PM',
    price: 100,
    seat: '1A'
  },
  getFlightStatus: {
    departingCity: 'Miami',
    departingAirport: 'Miami Intl',
    departingAirportCode: 'MIA',
    departingTime: '11:45 PM',
    arrivalCity: 'San Francisco',
    arrivalAirport: 'San Francisco Intl',
    arrivalAirportCode: 'SFO',
    arrivalTime: '4:20 PM',
    flightCode: 'XY 2421',
    date: 'Mon, 16 Sep'
  }
}
