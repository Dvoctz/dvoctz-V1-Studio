const fetch = require('node-fetch');
const supabaseUrl = 'https://qqtohsammqrebntgnowr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdG9oc2FtbXFyZWJudGdub3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTQ0MDksImV4cCI6MjA3NjUzMDQwOX0.zJyNgQRiLyF_vR7-JGHBauOGuG8vvLfXP90pUv0kPOM';
fetch(supabaseUrl + '/rest/v1/?apikey=' + supabaseKey)
  .then(r => r.json())
  .then(data => {
      const fs = require('fs');
      fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
  });
