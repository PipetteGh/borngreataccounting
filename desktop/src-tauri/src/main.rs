#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;

#[tauri::command]
fn manage_stack(action: String) -> Result<String, String> {
  let compose_args: Vec<&str> = match action.as_str() {
    "start" => vec!["compose", "-f", "docker-compose.production.yml", "up", "-d"],
    "stop" => vec!["compose", "-f", "docker-compose.production.yml", "down"],
    "restart" => vec!["compose", "-f", "docker-compose.production.yml", "restart"],
    "status" => vec!["compose", "-f", "docker-compose.production.yml", "ps"],
    _ => return Err(format!("Unsupported action: {}", action)),
  };

  let output = Command::new("docker")
    .args(&compose_args)
    .output()
    .map_err(|e| format!("Failed to invoke docker CLI: {}", e))?;

  let stdout = String::from_utf8_lossy(&output.stdout).to_string();
  let stderr = String::from_utf8_lossy(&output.stderr).to_string();

  if output.status.success() {
    Ok(format!("{}\n{}", stdout, stderr).trim().to_string())
  } else {
    Err(format!("Docker exited with error:\n{}\n{}", stdout, stderr))
  }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![manage_stack])
    .run(tauri::generate_context!())
    .expect("error while running BorngreatAccounting Desktop application");
}
