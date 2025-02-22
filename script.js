$(document).ready(function () {
  setTimeout(function () {
    $("#splashScreen").hide();
    $("#mainContent").show();
  }, 4000); // 4000 milliseconds
});

function solve() {
  var algorithm = document.getElementById("algorithm").value;
  var arrivalTimes = document.getElementById("arrivalTime").value.split(" ");
  var burstTimes = document.getElementById("burstTime").value.split(" ");
  var priorities = document.getElementById("priority") ? document.getElementById("priority").value.split(" ") : null;

  if (arrivalTimes.length !== burstTimes.length) {
    alert("Number of arrival times must match number of burst times.");
    return;
  }

  if (algorithm === "Priority" && (!priorities || priorities.length !== arrivalTimes.length)) {
    alert("For Priority scheduling, please enter priority values for each job.");
    return;
  }

  var outputHTML = `
    <table>
        <tr>
            <th>Job</th>
            <th>Arrival Time</th>
            <th>Burst Time</th>
            <th>Priority</th>
            <th>Finish Time</th>
            <th>Turnaround Time</th>
            <th>Waiting Time</th>
        </tr>
  `;

  var finishTimes = [];
  var currentTime = 0;
  var totalWaitingTime = 0;

  switch (algorithm) {
    case "Priority":
      var jobs = [];
      for (var i = 0; i < arrivalTimes.length; i++) {
        jobs.push({
          index: i,
          burstTime: parseInt(burstTimes[i]),
          arrivalTime: parseInt(arrivalTimes[i]),
          priority: parseInt(priorities[i])
        });
      }

      var completedJobs = 0;
      jobs.sort((a, b) => a.arrivalTime - b.arrivalTime);

      while (completedJobs < jobs.length) {
        var availableJobs = jobs.filter(
          (job) => job.arrivalTime <= currentTime && !finishTimes[job.index]
        );

        if (availableJobs.length === 0) {
          currentTime++;
          continue;
        }

        availableJobs.sort((a, b) => a.priority - b.priority);

        var highestPriorityJob = availableJobs[0];
        var jobIndex = highestPriorityJob.index;

        finishTimes[jobIndex] = currentTime + highestPriorityJob.burstTime;
        totalWaitingTime += currentTime - highestPriorityJob.arrivalTime;
        currentTime = finishTimes[jobIndex];

        completedJobs++;
      }
      break;

    case "FCFS":
      for (var i = 0; i < arrivalTimes.length; i++) {
        var arrival = parseInt(arrivalTimes[i]);
        var burst = parseInt(burstTimes[i]);

        if (currentTime < arrival) currentTime = arrival;
        
        finishTimes[i] = currentTime + burst;
        totalWaitingTime += currentTime - arrival;
        currentTime += burst;
      }
      break;

    case "SJF":
      var sjfJobs = [];
      for (var i = 0; i < arrivalTimes.length; i++) {
        sjfJobs.push({
          index: i,
          arrivalTime: parseInt(arrivalTimes[i]),
          burstTime: parseInt(burstTimes[i])
        });
      }
      sjfJobs.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);

      currentTime = 0;
      for (var i = 0; i < sjfJobs.length; i++) {
        var job = sjfJobs[i];
        if (currentTime < job.arrivalTime) currentTime = job.arrivalTime;
        
        finishTimes[job.index] = currentTime + job.burstTime;
        totalWaitingTime += currentTime - job.arrivalTime;
        currentTime += job.burstTime;
      }
      break;

    case "SRTF":
      var srtfJobs = arrivalTimes.map((arrival, index) => ({
        index: index,
        arrivalTime: parseInt(arrival),
        burstTime: parseInt(burstTimes[index]),
        remainingTime: parseInt(burstTimes[index])
      }));

      currentTime = 0;
      while (srtfJobs.some(job => job.remainingTime > 0)) {
        var availableJobs = srtfJobs.filter(job => job.arrivalTime <= currentTime && job.remainingTime > 0);
        if (availableJobs.length === 0) {
          currentTime++;
          continue;
        }

        availableJobs.sort((a, b) => a.remainingTime - b.remainingTime);

        var shortestJob = availableJobs[0];
        shortestJob.remainingTime--;
        currentTime++;

        if (shortestJob.remainingTime === 0) {
          finishTimes[shortestJob.index] = currentTime;
          totalWaitingTime += currentTime - shortestJob.arrivalTime - shortestJob.burstTime;
        }
      }
      break;

    case "RR":
      var quantum = parseInt(document.getElementById("quantum").value);
      var rrJobs = arrivalTimes.map((arrival, index) => ({
        index: index,
        arrivalTime: parseInt(arrival),
        burstTime: parseInt(burstTimes[index]),
        remainingTime: parseInt(burstTimes[index])
      }));

      currentTime = 0;
      while (rrJobs.some(job => job.remainingTime > 0)) {
        rrJobs.forEach(job => {
          if (job.arrivalTime <= currentTime && job.remainingTime > 0) {
            var timeSlice = Math.min(quantum, job.remainingTime);
            job.remainingTime -= timeSlice;
            currentTime += timeSlice;

            if (job.remainingTime === 0) {
              finishTimes[job.index] = currentTime;
              totalWaitingTime += currentTime - job.arrivalTime - job.burstTime;
            }
          }
        });
      }
      break;

    default:
      alert("Invalid algorithm selected.");
      return;
  }

  for (var i = 0; i < arrivalTimes.length; i++) {
    outputHTML += `
          <tr>
              <td>${i + 1}</td>
              <td>${arrivalTimes[i]}</td>
              <td>${burstTimes[i]}</td>
              <td>${priorities ? priorities[i] : '-'}</td>
              <td>${finishTimes[i]}</td>
              <td>${finishTimes[i] - parseInt(arrivalTimes[i])}</td>
              <td>${Math.max(0, finishTimes[i] - parseInt(arrivalTimes[i]) - parseInt(burstTimes[i]))}</td>
          </tr>
    `;
  }

  var totalTurnaroundTime = 0;
  for (var i = 0; i < arrivalTimes.length; i++) {
    totalTurnaroundTime += finishTimes[i] - parseInt(arrivalTimes[i]);
  }

  var averageTurnaroundTime = totalTurnaroundTime / arrivalTimes.length;
  var averageWaitingTime = totalWaitingTime / arrivalTimes.length;

  outputHTML += `
      <tr>
          <td colspan="4"><b>Average</b></td>
          <td>${averageTurnaroundTime.toFixed(2)}</td>
          <td>${averageWaitingTime.toFixed(2)}</td>
      </tr>
  `;

  outputHTML += `</table>`;

  var outputDiv = document.getElementById("output");
  outputDiv.innerHTML = outputHTML;
}
