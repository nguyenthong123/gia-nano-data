// ================= CẤU HÌNH TỔNG HỢP WEBER =================
const SHEET_ID = '11Q1rplw9sRqdQyiS2TXK9BsyMzTxb8KRin2INUkLEic'; 
const DRIVE_FOLDER_ID = '1Jm6v_wN1YbVM43RYFIMtQqXuaD-bCTnV'; 

const SHEET_NAME = 'bang_gia_web'; // QUẢN LÝ TẬP TRUNG TẠI ĐÂY
// =====================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || data.type;

    if (action === 'add' || action === 'save_product_with_image') {
      return saveProductToWeber(data);
    } 
    else if (action === 'update') {
      return updateProductWeber(data);
    } 
    else if (action === 'delete') {
      return deleteProductWeber(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({result: 'error', message: 'Action unknown: ' + action}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({result: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 1. THÊM MỚI (Lưu thẳng vào bang_gia_web)
function saveProductToWeber(data) {
  let fileUrl = '';
  if (data.image_base64) {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.image_base64), data.image_mime, data.image_name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // Thứ tự 11 cột: image, id_sp, ten_sp, so_chai, gia_le, gia_niemyet, km3, km2, km1, tang_them, trang_thai_xoa
  sheet.appendRow([
    fileUrl,
    data.id_san_pham || '',
    data.ten_san_pham,
    data.so_chai_thung || '',
    data.gia_ban_le || '',
    data.gia_niem_yet || '',
    data.km_3_thung || '',
    data.km_2_thung || '',
    data.km_1_thung || '',
    data.tang_them || '',
    '' // Cột K: trang_thai_xoa lúc mới thêm là trống
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({result: 'success', url: fileUrl}))
      .setMimeType(ContentService.MimeType.JSON);
}

// 2. CHỈNH SỬA (Thực hiện trên bang_gia_web)
function updateProductWeber(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  const targetName = data.ten_sp_old || data.ten_san_pham;
  let rowIndex = -1;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][2] == targetName) { // Cột C (index 2) là tên sản phẩm
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return ContentService.createTextOutput(JSON.stringify({result: 'error', message: 'Không tìm thấy sản phẩm'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Cập nhật ảnh nếu có up ảnh mới
  if (data.image_base64) {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.image_base64), data.image_mime, data.image_name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const newUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    sheet.getRange(rowIndex, 1).setValue(newUrl);
  }

  sheet.getRange(rowIndex, 2).setValue(data.id_san_pham || ""); 
  sheet.getRange(rowIndex, 3).setValue(data.ten_san_pham);
  sheet.getRange(rowIndex, 4).setValue(data.so_chai_thung || "");
  sheet.getRange(rowIndex, 5).setValue(data.gia_ban_le || "");
  sheet.getRange(rowIndex, 6).setValue(data.gia_niem_yet || "");
  sheet.getRange(rowIndex, 7).setValue(data.km_3_thung || "");
  sheet.getRange(rowIndex, 8).setValue(data.km_2_thung || "");
  sheet.getRange(rowIndex, 9).setValue(data.km_1_thung || "");
  sheet.getRange(rowIndex, 10).setValue(data.tang_them || "");
  
  return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
}

// 3. XÓA MỀM (SOFT DELETE) - Thực hiện trên bang_gia_web, cột K (index 10)
function deleteProductWeber(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][2] == data.ten_san_pham) { // Tìm theo tên ở cột C
      sheet.getRange(i + 1, 11).setValue("Xóa"); // Cột K là index 10 (1-indexed là 11)
      return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({result: 'error', message: 'Không tìm thấy'})).setMimeType(ContentService.MimeType.JSON);
}
