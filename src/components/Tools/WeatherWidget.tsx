import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Droplets, Compass, Search, MapPin, RefreshCw, Thermometer } from 'lucide-react';

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  weatherCode: number;
  daily: Array<{
    day: string;
    max: number;
    min: number;
    code: number;
  }>;
}

export const WeatherWidget: React.FC<{ defaultCity?: string }> = ({ defaultCity = 'Islamabad' }) => {
  const [cityInput, setCityInput] = useState(defaultCity);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularCities = ['Islamabad', 'Lahore', 'Karachi', 'Delhi', 'Dubai', 'London', 'New York'];

  const interpretWMO = (code: number): { label: string; icon: any; color: string } => {
    if (code === 0) return { label: 'Clear Sky', icon: Sun, color: 'text-amber-400' };
    if ([1, 2].includes(code)) return { label: 'Partly Cloudy', icon: Cloud, color: 'text-cyan-300' };
    if ([3].includes(code)) return { label: 'Overcast', icon: Cloud, color: 'text-slate-400' };
    if ([45, 48].includes(code)) return { label: 'Foggy / Haze', icon: Cloud, color: 'text-slate-400' };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { label: 'Rain Showers', icon: CloudRain, color: 'text-blue-400' };
    if ([71, 73, 75, 85, 86].includes(code)) return { label: 'Snowfall', icon: CloudRain, color: 'text-cyan-200' };
    if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-purple-400' };
    return { label: 'Fair Conditions', icon: Sun, color: 'text-amber-300' };
  };

  const fetchWeather = async (targetCity: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Geocode city name via Open-Meteo geocoding API
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(targetCity)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location telemetry not found for "${targetCity}".`);
      }

      const loc = geoData.results[0];
      const lat = loc.latitude;
      const lon = loc.longitude;
      const resolvedName = loc.name;
      const country = loc.country || '';

      // 2. Fetch forecast
      const forecastRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const data = await forecastRes.json();

      const cur = data.current;
      const dailyData = data.daily;

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyList = dailyData.time.slice(0, 5).map((dateStr: string, idx: number) => {
        const d = new Date(dateStr);
        return {
          day: idx === 0 ? 'Today' : daysOfWeek[d.getDay()],
          max: Math.round(dailyData.temperature_2m_max[idx]),
          min: Math.round(dailyData.temperature_2m_min[idx]),
          code: dailyData.weather_code[idx],
        };
      });

      setWeather({
        city: resolvedName,
        country,
        temp: Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        humidity: cur.relative_humidity_2m,
        windSpeed: Math.round(cur.wind_speed_10m),
        condition: interpretWMO(cur.weather_code).label,
        weatherCode: cur.weather_code,
        daily: dailyList,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to establish satellite weather link.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(defaultCity);
  }, []);

  const WeatherIcon = weather ? interpretWMO(weather.weatherCode).icon : Cloud;

  return (
    <div className="bg-[#08122B]/90 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md shadow-xl text-slate-100">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-hud text-cyan-400 uppercase tracking-widest">Orbital Meteorological Sensor</span>
            <h3 className="text-base font-bold font-tech text-white">Atmospheric Telemetry</h3>
          </div>
        </div>

        {/* Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (cityInput.trim()) fetchWeather(cityInput.trim());
          }}
          className="flex items-center gap-1.5 bg-[#050A17] border border-cyan-500/30 rounded-xl px-2.5 py-1"
        >
          <Search className="w-4 h-4 text-cyan-400" />
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Search city..."
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-28 sm:w-36 font-tech"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-1 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {/* Quick city presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 text-xs scrollbar-none">
        {popularCities.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCityInput(c);
              fetchWeather(c);
            }}
            className={`px-2.5 py-1 rounded-lg font-tech text-xs transition-all shrink-0 ${
              weather?.city.toLowerCase() === c.toLowerCase()
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                : 'bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Weather Content */}
      {error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
          {error}
        </div>
      ) : weather ? (
        <div>
          {/* Main Hero Temp */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#071330] to-[#0D1C44] border border-cyan-500/20 mb-4">
            <div>
              <div className="flex items-center gap-1 text-slate-300 text-sm font-tech">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-white">{weather.city}</span>
                {weather.country && <span className="text-slate-400">, {weather.country}</span>}
              </div>
              <div className="text-4xl font-extrabold font-hud text-white mt-1 text-glow-cyan">
                {weather.temp}°C
              </div>
              <div className="text-xs font-tech text-cyan-300 mt-0.5">
                {weather.condition} • Feels like {weather.feelsLike}°C
              </div>
            </div>

            <div className="flex flex-col items-center">
              <WeatherIcon className={`w-14 h-14 ${interpretWMO(weather.weatherCode).color} drop-shadow-lg`} />
            </div>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-2.5 mb-4 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#050A17] border border-cyan-500/20">
              <Thermometer className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-tech">Feels Like</div>
                <div className="font-hud font-bold text-white">{weather.feelsLike}°C</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#050A17] border border-cyan-500/20">
              <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-tech">Humidity</div>
                <div className="font-hud font-bold text-white">{weather.humidity}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#050A17] border border-cyan-500/20">
              <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-tech">Wind Speed</div>
                <div className="font-hud font-bold text-white">{weather.windSpeed} km/h</div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast Strip */}
          <div className="pt-2 border-t border-cyan-500/20">
            <div className="text-[10px] font-hud text-slate-400 uppercase tracking-wider mb-2">5-Day Forecast</div>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {weather.daily.map((d, i) => {
                const DayIcon = interpretWMO(d.code).icon;
                return (
                  <div key={i} className="p-2 rounded-lg bg-[#050B1B]/60 border border-white/5 flex flex-col items-center">
                    <span className="text-[11px] font-tech text-slate-300 font-semibold">{d.day}</span>
                    <DayIcon className={`w-5 h-5 my-1.5 ${interpretWMO(d.code).color}`} />
                    <div className="text-[11px] font-hud text-white font-bold">{d.max}°</div>
                    <div className="text-[9px] font-hud text-slate-400">{d.min}°</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-8 text-cyan-400 text-xs font-tech animate-pulse">
          Establishing satellite weather telemetry...
        </div>
      )}
    </div>
  );
};
