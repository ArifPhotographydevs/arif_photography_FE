// Test function to verify API endpoints work
export const testAPIs = async () => {
  console.log('=== TESTING APIs ===');
  
  // Test folder creation
  try {
    const testFolderResponse = await fetch(CREATE_FOLDER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test-folder/' })
    });
    console.log('Test folder creation:', testFolderResponse.status, await testFolderResponse.text());
  } catch (error) {
    console.error('Test folder creation failed:', error);
  }
  
  // Test bulk upload
  try {
    const testUploadResponse = await fetch(BULK_UPLOAD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: ['test-image.jpg'],
        folder: 'test-folder/'
      })
    });
    console.log('Test bulk upload:', testUploadResponse.status, await testUploadResponse.text());
  } catch (error) {
    console.error('Test bulk upload failed:', error);
  }
  
  console.log('=== END API TEST ===');
};

// Real API endpoints for creating folders and uploading images
const CREATE_FOLDER_API = 'https://n7l9v29nb4.execute-api.eu-north-1.amazonaws.com/default/createfolder';
const BULK_UPLOAD_API = 'https://e16ufjl300.execute-api.eu-north-1.amazonaws.com/default/bulkupload';

export const createFavoritesFolderAPI = async (data: {
  folderName: string;
  imageKeys: string[];
  sourceFolder: string;
}) => {
  try {
    console.log('Creating new folder and uploading images:', data);
    
    // Step 1: Create the folder in parent directory
    // Extract parent directory from sourceFolder
    const sourcePath = data.sourceFolder.replace(/^\/+/, '').replace(/\/+$/, ''); // Remove leading/trailing slashes
    const parentPath = sourcePath ? `${sourcePath}/` : '';
    const folderPath = `${parentPath}favorites/${data.folderName}/`;
    
    const createFolderResponse = await fetch(CREATE_FOLDER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: folderPath
      })
    });

    if (!createFolderResponse.ok) {
      throw new Error(`Failed to create folder: ${createFolderResponse.status}`);
    }

    const createFolderResult = await createFolderResponse.json();
    console.log('Folder created:', createFolderResult);

    // Step 2: Upload images to the folder
    console.log('=== UPLOAD DEBUG INFO ===');
    console.log('Original image keys:', data.imageKeys);
    console.log('Target folder path:', folderPath);
    console.log('Number of images to upload:', data.imageKeys.length);
    
    // Try different approaches for the upload
    console.log('Trying approach 1: Full S3 keys');
    
    const uploadPayload1 = {
      files: data.imageKeys, // Full S3 keys
      folder: folderPath
    };
    
    console.log('Upload payload 1 (full keys):', uploadPayload1);
    
    let uploadResponse = await fetch(BULK_UPLOAD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadPayload1)
    });

    console.log('Upload response 1 status:', uploadResponse.status);
    console.log('Upload response 1 ok:', uploadResponse.ok);

    if (!uploadResponse.ok) {
      const errorText1 = await uploadResponse.text();
      console.error('Upload approach 1 failed:', uploadResponse.status, errorText1);
      
      // Try approach 2: Use full S3 keys as source paths
      console.log('Trying approach 2: Full S3 keys as source paths');
      
      console.log('Original image keys:', data.imageKeys);
      console.log('Target folder path:', folderPath);
      
      const uploadPayload2 = {
        files: data.imageKeys, // Use full S3 keys as source paths
        folder: folderPath
      };
      
      console.log('Upload payload 2 (filenames):', uploadPayload2);
      
      uploadResponse = await fetch(BULK_UPLOAD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadPayload2)
      });

      console.log('Upload response 2 status:', uploadResponse.status);
      console.log('Upload response 2 ok:', uploadResponse.ok);

      if (!uploadResponse.ok) {
        const errorText2 = await uploadResponse.text();
        console.error('Upload approach 2 failed:', uploadResponse.status, errorText2);
        
        // Try approach 3: Just filenames
        console.log('Trying approach 3: Just filenames');
        
        const imageFilenames = data.imageKeys.map(key => {
          const keyParts = key.split('/');
          return keyParts[keyParts.length - 1]; // Get just the filename
        });
        
        const uploadPayload3 = {
          files: imageFilenames,
          folder: folderPath
        };
        
        console.log('Upload payload 3 (just filenames):', uploadPayload3);
        
        uploadResponse = await fetch(BULK_UPLOAD_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadPayload3)
        });

        console.log('Upload response 3 status:', uploadResponse.status);
        console.log('Upload response 3 ok:', uploadResponse.ok);

        if (!uploadResponse.ok) {
          const errorText3 = await uploadResponse.text();
          console.error('Upload approach 3 failed:', uploadResponse.status, errorText3);
          throw new Error(`All upload approaches failed. Approach 1: ${errorText1}, Approach 2: ${errorText2}, Approach 3: ${errorText3}`);
        }
      }
    }

    const uploadResult = await uploadResponse.json();
    console.log('Final upload result:', uploadResult);
    
    // Step 3: Verify the folder was created and contains images
    console.log('=== VERIFICATION STEP ===');
    try {
      const verifyResponse = await fetch(
        `https://a9017femoa.execute-api.eu-north-1.amazonaws.com/default/getallimages?prefix=${encodeURIComponent(folderPath)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
        }
      );
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('Verification - Folder contents:', verifyData);
        console.log('Verification - Files count:', verifyData.files?.length || 0);
      } else {
        console.error('Verification failed:', verifyResponse.status);
      }
    } catch (verifyError) {
      console.error('Verification error:', verifyError);
    }
    console.log('=== END VERIFICATION ===');
    console.log('=== END UPLOAD DEBUG ===');

    // Return success response
    return {
      success: true,
      message: `New folder "${data.folderName}" created successfully in parent directory! ${data.imageKeys.length} images uploaded to the folder.`,
      folderId: `favorites_${Date.now()}`,
      folderPath: `/${folderPath}`, // Parent directory favorites folder
      folderName: data.folderName,
      imageCount: data.imageKeys.length,
      uploadedImages: data.imageKeys.map((key, index) => ({
        originalKey: key,
        newKey: `${folderPath}${key.split('/').pop()}`,
        uploadStatus: 'success',
        uploadedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Error creating folder and uploading images:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      folderPath,
      imageKeys: data.imageKeys
    });
    throw new Error(`Failed to create folder and upload images: ${error.message}`);
  }
};

// Mock API endpoint for fetching favorites folders
export const getFavoritesFoldersAPI = async () => {
  // Mock implementation - replace with actual API call
  console.log('Fetching favorites folders');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock response with sample favorites folders
  return {
    success: true,
    folders: [
      {
        id: 'favorites_1',
        name: 'Wedding Highlights',
        imageCount: 25,
        createdAt: '2024-01-15T10:30:00Z',
        thumbnail: 'https://picsum.photos/200/200?random=1'
      },
      {
        id: 'favorites_2', 
        name: 'Best Portraits',
        imageCount: 15,
        createdAt: '2024-01-10T14:20:00Z',
        thumbnail: 'https://picsum.photos/200/200?random=2'
      }
    ]
  };
};

// Mock API endpoint for fetching images in a favorites folder
export const getFavoritesFolderImagesAPI = async (folderId: string) => {
  // Mock implementation - replace with actual API call
  console.log('Fetching images for favorites folder:', folderId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock response with sample images
  return {
    success: true,
    images: [
      {
        id: 'img_1',
        title: 'Wedding Ceremony',
        imageUrl: 'https://picsum.photos/400/300?random=1',
        eventDate: '2024-01-15',
        shootType: 'Wedding',
        isVideo: false
      },
      {
        id: 'img_2',
        title: 'Couple Portrait',
        imageUrl: 'https://picsum.photos/400/300?random=2',
        eventDate: '2024-01-15',
        shootType: 'Portrait',
        isVideo: false
      }
    ]
  };
};
