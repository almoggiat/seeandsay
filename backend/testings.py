from MongoDB import SeeSayMongoStorage

from server import *




if __name__ == "__main__":
    print("This is main function of testings.py")

    print("Testing audiofile storage")

    output_path="output_audio.mp3"
    # file_id=storage.upload_audio("/home/tom/PycharmProjects/seeandsay/backend/testRecording.m4a")
    storage.get_user_audioFile_from_64base(user_id=234567891,output_path=output_path)

