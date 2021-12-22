const path = require("path");
// pyinstaller -w --onefile --distpath dist-python web_app/segmenter_flask_API.py 
const spawn = require("child_process").spawn,
  ls = spawn(
    "pyinstaller",
    [
      "-w",
      "--onefile",
      "--distpath dist-python",
      "web_app/segmenter_flask_API.py",
    ],
    {
      shell: true,
    }
  );

ls.stdout.on("data", function (data) {
  // stream output of build process
  console.log(data.toString());
});

ls.stderr.on("data", function (data) {
  console.log("PyInstaller Output : " + data.toString());
});
ls.on("exit", function (code) {
  console.log("child process exited with code " + code.toString());
});
