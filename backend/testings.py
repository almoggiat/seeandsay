from MongoDB import SeeSayMongoStorage

from server import *




if __name__ == "__main__":
    print("This is main function of testings.py")

    print("Testing audiofile storage")

    output_path="audio_tom.mp3"
    # file_id=storage.upload_audio("/home/tom/PycharmProjects/seeandsay/backend/testRecording.m4a")
    storage.get_user_audioFile_from_64base(user_id=333333333,output_path=output_path)

