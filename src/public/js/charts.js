document.addEventListener('DOMContentLoaded', () => {
  const d = document.getElementById('chartDonations');
  const v = document.getElementById('chartVolunteers');
  if (d && window.Chart) {
    new Chart(d, { type: 'bar', data: { labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ label:'Donations', data:[5,7,6,9,8,10,4] }] } });
  }
  if (v && window.Chart) {
    new Chart(v, { type: 'doughnut', data: { labels:['Delivered','Pending'], datasets: [{ data:[72,28] }] } });
  }
});
