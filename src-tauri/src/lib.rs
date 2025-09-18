// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use serde::Serialize;
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;
use tauri::{AppHandle, Manager, Emitter, State};
use notify::{Watcher, RecursiveMode, Event, EventKind};
use uuid::Uuid;

// Global state for file watchers
type WatcherMap = Arc<Mutex<HashMap<String, notify::RecommendedWatcher>>>;

#[derive(Serialize)]
struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
}

#[derive(Serialize)]
struct FileMetadata {
    name: String,
    path: String,
    size: u64,
    last_modified: u64, // Unix timestamp in milliseconds
    is_dir: bool,
}

#[tauri::command]
fn start_file_watcher(path: String, app_handle: AppHandle) -> Result<String, String> {
    let watcher_id = Uuid::new_v4().to_string();
    let app_handle_clone = app_handle.clone();
    let watcher_id_clone = watcher_id.clone();
    
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        match res {
            Ok(event) => {
                let app_handle = app_handle_clone.clone();
                let watcher_id = watcher_id_clone.clone();
                
                match event.kind {
                    EventKind::Create(_) => {
                        for path in event.paths {
                            let _ = app_handle.emit(&format!("file-created-{}", watcher_id), path.display().to_string());
                        }
                    },
                    EventKind::Remove(_) => {
                        for path in event.paths {
                            let _ = app_handle.emit(&format!("file-deleted-{}", watcher_id), path.display().to_string());
                        }
                    },
                    EventKind::Modify(_) => {
                        for path in event.paths {
                            let _ = app_handle.emit(&format!("file-changed-{}", watcher_id), path.display().to_string());
                        }
                    },
                    _ => {}
                }
            },
            Err(e) => eprintln!("File watcher error: {:?}", e),
        }
    }).map_err(|e| e.to_string())?;

    watcher.watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    // Store the watcher in app state
    let watchers_state: State<WatcherMap> = app_handle.state();
    let watchers = watchers_state.inner().clone();
    
    watchers.lock().unwrap().insert(watcher_id.clone(), watcher);
    
    Ok(watcher_id)
}

#[tauri::command]
fn stop_file_watcher(watcher_id: String, app_handle: AppHandle) -> Result<(), String> {
    let watchers_state: State<WatcherMap> = app_handle.state();
    let watchers = watchers_state.inner().clone();
    
    let mut watchers_lock = watchers.lock().unwrap();
    watchers_lock.remove(&watcher_id).ok_or("Watcher not found")?;
    
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_dir_tree(path: String) -> Result<Vec<FileNode>, String> {
    fn read_dir_recursive(path: &Path) -> Result<FileNode, String> {
        let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
        let is_dir = metadata.is_dir();
        let name = path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path.display().to_string());
        let path_str = path.display().to_string();
        let children = if is_dir {
            let mut nodes = Vec::new();
            for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
                let entry = entry.map_err(|e| e.to_string())?;
                let child_path = entry.path();
                nodes.push(read_dir_recursive(&child_path)?);
            }
            Some(nodes)
        } else {
            None
        };
        Ok(FileNode { name, path: path_str, is_dir, children })
    }
    let root = Path::new(&path);
    if !root.exists() {
        return Err("Path does not exist".to_string());
    }
    if !root.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    let mut nodes = Vec::new();
    for entry in fs::read_dir(root).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let child_path = entry.path();
        nodes.push(read_dir_recursive(&child_path)?);
    }
    Ok(nodes)
}

#[tauri::command]
fn create_md_file(dir_path: String, file_name: String) -> Result<String, String> {
    let mut path = Path::new(&dir_path).join(file_name);
    if !path.extension().map_or(false, |ext| ext == "md") {
        path.set_extension("md");
    }
    
    if path.exists() {
        return Err("File already exists".to_string());
    }
    
    fs::write(&path, "# Novo Arquivo\n\nEscreva seu conteúdo aqui...").map_err(|e| e.to_string())?;
    Ok(path.display().to_string())
}

#[tauri::command]
fn read_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_file_metadata(file_path: String) -> Result<FileMetadata, String> {
    let path = Path::new(&file_path);
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    
    let name = path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.display().to_string());
    
    let last_modified = metadata.modified()
        .map_err(|e| e.to_string())?
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as u64;
    
    Ok(FileMetadata {
        name,
        path: file_path,
        size: metadata.len(),
        last_modified,
        is_dir: metadata.is_dir(),
    })
}

#[tauri::command]
fn write_file_content(file_path: String, content: String) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn rename_file(old_path: String, new_name: String) -> Result<String, String> {
    let old_path = Path::new(&old_path);
    let parent = old_path.parent().ok_or("Invalid path")?;
    let new_path = parent.join(new_name);
    
    if new_path.exists() {
        return Err("A file with this name already exists".to_string());
    }
    
    fs::rename(old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(new_path.display().to_string())
}

#[tauri::command]
fn create_folder(dir_path: String, folder_name: String) -> Result<String, String> {
    let path = Path::new(&dir_path).join(folder_name);
    
    if path.exists() {
        return Err("Folder already exists".to_string());
    }
    
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(path.display().to_string())
}

#[tauri::command]
fn copy_file(source_path: String, dest_dir: String) -> Result<String, String> {
    let source = Path::new(&source_path);
    let dest_dir = Path::new(&dest_dir);
    let file_name = source.file_name().ok_or("Invalid source path")?;
    
    // Generate unique name if file already exists
    let mut dest_path = dest_dir.join(file_name);
    if dest_path.exists() {
        let stem = source.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("copy");
        let extension = source.extension()
            .and_then(|s| s.to_str())
            .unwrap_or("");
        
        let mut counter = 1;
        loop {
            let new_name = if extension.is_empty() {
                format!("{}_copy_{}", stem, counter)
            } else {
                format!("{}_copy_{}.{}", stem, counter, extension)
            };
            dest_path = dest_dir.join(new_name);
            if !dest_path.exists() {
                break;
            }
            counter += 1;
        }
    }
    
    if source.is_dir() {
        copy_dir_recursively(source, &dest_path)?;
    } else {
        fs::copy(source, &dest_path).map_err(|e| e.to_string())?;
    }
    
    Ok(dest_path.display().to_string())
}

fn copy_dir_recursively(source: &Path, dest: &Path) -> Result<(), String> {
    fs::create_dir_all(dest).map_err(|e| e.to_string())?;
    
    for entry in fs::read_dir(source).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();
        let dest_path = dest.join(entry.file_name());
        
        if entry_path.is_dir() {
            copy_dir_recursively(&entry_path, &dest_path)?;
        } else {
            fs::copy(&entry_path, &dest_path).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[tauri::command]
fn show_editor_context_menu(app_handle: AppHandle, x: f64, y: f64, selected_text: String) -> Result<(), String> {
    // Emit event to frontend instead of native menu for now
    let window = app_handle.get_webview_window("main").ok_or("Window not found")?;
    let _ = window.emit("editor-context-menu", json!({
        "x": x,
        "y": y,
        "selectedText": selected_text
    }));
    
    Ok(())
}

#[tauri::command]
fn show_file_context_menu(app_handle: AppHandle, x: f64, y: f64, file_path: String, is_dir: bool) -> Result<(), String> {
    // Emit event to frontend instead of native menu for now
    let window = app_handle.get_webview_window("main").ok_or("Window not found")?;
    let _ = window.emit("file-context-menu", json!({
        "x": x,
        "y": y,
        "filePath": file_path,
        "isDir": is_dir
    }));
    
    Ok(())
}

#[tauri::command]
fn editor_action(app_handle: AppHandle, action: String, selected_text: String) -> Result<(), String> {
    // Emit action to frontend for the editor to handle
    let window = app_handle.get_webview_window("main").ok_or("Window not found")?;
    let _ = window.emit("editor-action", json!({
        "action": action,
        "selectedText": selected_text
    }));
    
    Ok(())
}

#[tauri::command]
fn open_in_explorer(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    let target_path = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(target_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(target_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(target_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(Mutex::new(HashMap::<String, notify::RecommendedWatcher>::new())))
        .invoke_handler(tauri::generate_handler![
            greet, 
            read_dir_tree, 
            create_md_file, 
            read_file_content, 
            get_file_metadata,
            write_file_content,
            delete_file,
            rename_file,
            create_folder,
            copy_file,
            open_in_explorer,
            show_editor_context_menu,
            show_file_context_menu,
            editor_action,
            start_file_watcher,
            stop_file_watcher
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
