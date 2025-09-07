import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { location } = await request.json();
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Executa comando Claude CLI com MCP
    return new Promise((resolve) => {
      const claudeProcess = spawn('claude', ['mcp', 'execute'], {
        env: { ...process.env },
        cwd: process.cwd()
      });
      
      let output = '';
      let error = '';
      
      // Envia comando para obter clima
      const command = `iremaltunay-55-deneme-1 - get_weather_by_city(city_name: "${location}", country_code: "BR", units: "metric")`;
      claudeProcess.stdin.write(command + '\n');
      claudeProcess.stdin.end();
      
      claudeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      claudeProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      claudeProcess.on('close', (code) => {
        if (code !== 0 || error) {
          console.error('MCP weather error:', error);
          // Fallback para dados simulados
          resolve(NextResponse.json({
            result: {
              location,
              temperature: 25,
              condition: 'Parcialmente nublado',
              humidity: 65,
              windSpeed: 12,
              description: `Clima atual em ${location}`,
              source: 'simulated'
            }
          }));
        } else {
          try {
            // Parse output do MCP
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              
              // Formata dados do MCP para nosso formato
              const formattedData = {
                location,
                temperature: data.ana?.sicaklik || data.main?.temp || 25,
                condition: data.hava?.[0]?.aciklama || data.weather?.[0]?.description || 'Desconhecido',
                humidity: data.ana?.nem || data.main?.humidity || 50,
                windSpeed: data.ruzgar?.hiz || data.wind?.speed || 0,
                pressure: data.ana?.basinc || data.main?.pressure || 1013,
                visibility: data.gorunurluk || data.visibility || 10000,
                feelsLike: data.ana?.hissedilen || data.main?.feels_like || 25,
                source: 'mcp'
              };
              
              resolve(NextResponse.json({ result: formattedData }));
            } else {
              throw new Error('Could not parse MCP output');
            }
          } catch (e) {
            console.error('Parse error:', e);
            // Fallback
            resolve(NextResponse.json({
              result: {
                location,
                temperature: 25,
                condition: 'Dados indisponíveis',
                humidity: 65,
                windSpeed: 12,
                source: 'simulated'
              }
            }));
          }
        }
      });
    });
  } catch (error) {
    console.error('Weather MCP error:', error);
    return NextResponse.json(
      { error: 'Failed to get weather data' },
      { status: 500 }
    );
  }
}