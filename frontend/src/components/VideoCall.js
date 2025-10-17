import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import { liveClassAPI } from "../api";

const VideoCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveClass, setLiveClass] = useState(null);
  const [agoraConfig, setAgoraConfig] = useState(null);
  const [joined, setJoined] = useState(false);
  const [localTracks, setLocalTracks] = useState({
    videoTrack: null,
    audioTrack: null,
  });
  const [remoteTracks, setRemoteTracks] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [client, setClient] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [localUid, setLocalUid] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const hasJoined = useRef(false);

  useEffect(() => {
    // Get current user info
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    if (!hasJoined.current) {
      hasJoined.current = true;
      joinClass();
    }
    return () => {
      cleanupTracks();
    };
  }, [id]);

  const cleanupTracks = async () => {
    console.log("🧹 Cleaning up tracks and client...");

    // Stop and close local tracks
    if (localTracks.audioTrack) {
      localTracks.audioTrack.stop();
      localTracks.audioTrack.close();
      console.log("✅ Audio track stopped and closed");
    }
    if (localTracks.videoTrack) {
      localTracks.videoTrack.stop();
      localTracks.videoTrack.close();
      console.log("✅ Video track stopped and closed");
    }

    // Leave Agora channel and cleanup client
    if (client) {
      try {
        await client.leave();
        console.log("✅ Left Agora channel");
      } catch (err) {
        console.error("Error leaving channel:", err);
      }
    }
  };

  // Play local video when track is available
  useEffect(() => {
    if (localTracks.videoTrack && joined) {
      const localPlayerContainer = document.getElementById("local-player");
      if (localPlayerContainer) {
        localTracks.videoTrack.play(localPlayerContainer);
      }
    }
  }, [localTracks.videoTrack, joined]);

  // Play remote videos when they're available
  useEffect(() => {
    Object.keys(remoteTracks).forEach((key) => {
      if (key.includes("-video")) {
        const uid = key.split("-")[0];
        const videoTrack = remoteTracks[key];
        const playerContainer = document.getElementById(`player-${uid}`);
        if (playerContainer && videoTrack) {
          videoTrack.play(playerContainer);
        }
      }
    });
  }, [remoteTracks]);

  const joinClass = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🎥 Joining live class:", id);

      const response = await liveClassAPI.joinLiveClass(id);
      console.log("✅ Join response:", response.data);

      const { liveClass: classData, agora } = response.data;

      if (!agora || !agora.appId || !agora.channel || !agora.token) {
        throw new Error("Invalid Agora configuration received from server");
      }

      setLiveClass(classData);
      setAgoraConfig(agora);
      setIsTeacher(agora.role === "publisher");
      setLocalUid(agora.uid); // Store local UID

      console.log("📺 Initializing Agora client...");
      console.log("🆔 Local UID:", agora.uid);
      console.log("👤 Role:", agora.role);
      // Initialize Agora client
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);

      // Event handlers
      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        console.log("✅ Subscribe success", user.uid, mediaType);

        if (mediaType === "video") {
          setRemoteTracks((prev) => ({
            ...prev,
            [`${user.uid}-video`]: user.videoTrack,
          }));
        }

        if (mediaType === "audio") {
          setRemoteTracks((prev) => ({
            ...prev,
            [`${user.uid}-audio`]: user.audioTrack,
          }));
          // Play audio immediately
          user.audioTrack.play();
        }
      });

      agoraClient.on("user-unpublished", (user, mediaType) => {
        console.log("👋 User unpublished", user.uid, mediaType);
        if (mediaType === "video") {
          setRemoteTracks((prev) => {
            const newTracks = { ...prev };
            delete newTracks[`${user.uid}-video`];
            return newTracks;
          });
        }
        if (mediaType === "audio") {
          setRemoteTracks((prev) => {
            const newTracks = { ...prev };
            delete newTracks[`${user.uid}-audio`];
            return newTracks;
          });
        }
      });

      console.log("🔌 Joining Agora channel:", agora.channel);
      // Join the channel
      await agoraClient.join(
        agora.appId,
        agora.channel,
        agora.token,
        agora.uid
      );
      console.log("✅ Successfully joined Agora channel");

      // Create local tracks (for teacher or if student wants to enable camera)
      if (agora.role === "publisher") {
        console.log("🎤 Creating local tracks (Teacher)...");
        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        console.log("✅ Local tracks created");
        setLocalTracks({ audioTrack, videoTrack });

        // Publish local tracks
        console.log("📤 Publishing local tracks...");
        await agoraClient.publish([audioTrack, videoTrack]);
        console.log("✅ Local tracks published");
      }

      setJoined(true);
      setLoading(false);
      console.log("🎉 Successfully joined live class!");
    } catch (err) {
      console.error("❌ Error joining class:", err);
      console.error("Error details:", err.response?.data);
      setError(
        err.response?.data?.error || err.message || "Failed to join live class"
      );
      setLoading(false);
    }
  };

  // Enable camera and mic for students
  const enableLocalMedia = async () => {
    try {
      if (!localTracks.videoTrack && !localTracks.audioTrack) {
        console.log("🎤 Creating local tracks for student...");
        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        console.log("✅ Student local tracks created");
        setLocalTracks({ audioTrack, videoTrack });

        // Publish local tracks
        console.log("📤 Publishing student tracks...");
        await client.publish([audioTrack, videoTrack]);
        console.log("✅ Student tracks published");
      }
    } catch (err) {
      console.error("❌ Error enabling local media:", err);
      alert("Failed to enable camera/microphone. Please check permissions.");
    }
  };

  const leaveClass = async () => {
    console.log("👋 Leaving class...");
    await cleanupTracks();
    navigate(-1);
  };

  const toggleMute = async () => {
    if (localTracks.audioTrack) {
      await localTracks.audioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localTracks.videoTrack) {
      await localTracks.videoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const endClass = async () => {
    if (window.confirm("Are you sure you want to end this live class?")) {
      try {
        console.log("🛑 Ending live class:", id);
        const response = await liveClassAPI.endLiveClass(id);
        console.log("✅ End class response:", response.data);
        alert("Live class ended successfully");
        await leaveClass();
      } catch (err) {
        console.error("❌ Error ending class:", err);
        console.error("❌ Error response:", err.response?.data);
        const errorMsg =
          err.response?.data?.error || "Failed to end class. Please try again.";
        alert(errorMsg);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Joining live class...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-white text-red-500 px-4 py-2 rounded hover:bg-gray-100"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-xl font-bold">{liveClass?.title}</h1>
            <p className="text-gray-400 text-sm">{liveClass?.course}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Participant Count */}
            <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-full">
              <svg
                className="w-4 h-4 text-gray-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-white text-sm font-medium">
                {Object.keys(remoteTracks).filter((k) => k.includes("-video"))
                  .length + (localTracks.videoTrack ? 1 : 0)}{" "}
                Participants
              </span>
            </div>
            {/* Live Badge */}
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="p-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local Video - Your Video */}
            <div
              className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: "16/9" }}
            >
              {localTracks.videoTrack ? (
                <>
                  <div id="local-player" className="w-full h-full" />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm">
                    You (
                    {currentUser?.name || (isTeacher ? "Teacher" : "Student")})
                  </div>
                  {isMuted && (
                    <div className="absolute top-4 right-4 bg-red-500 p-2 rounded-full shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  {isVideoOff && (
                    <div className="absolute top-4 left-4 bg-gray-700 bg-opacity-75 px-3 py-1 rounded-full text-white text-xs backdrop-blur-sm">
                      Camera Off
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                  {!isTeacher && joined ? (
                    <div
                      className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                      onClick={enableLocalMedia}
                    >
                      <div className="mb-4 bg-blue-600 p-6 rounded-full">
                        <svg
                          className="w-12 h-12 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-white text-xl font-bold mb-2">
                        Enable Your Camera
                      </p>
                      <p className="text-gray-400 text-sm">
                        Click to join with video
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="mb-4 bg-gray-700 p-6 rounded-full">
                        <svg
                          className="w-12 h-12 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-lg">Camera Off</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Remote Videos - Other Participants */}
            <div
              className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: "16/9" }}
            >
              {Object.keys(remoteTracks).filter((key) => key.includes("-video"))
                .length > 0 ? (
                Object.keys(remoteTracks)
                  .filter((key) => key.includes("-video"))
                  .slice(0, 1)
                  .map((key) => {
                    const uid = key.split("-")[0];
                    return (
                      <div key={uid} className="w-full h-full relative">
                        <div id={`player-${uid}`} className="w-full h-full" />
                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm">
                          {isTeacher ? "Student" : "Teacher"} (ID: {uid})
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="animate-pulse mb-4 bg-gray-700 p-6 rounded-full">
                    <svg
                      className="w-12 h-12 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg font-medium">
                    {isTeacher
                      ? "Waiting for students..."
                      : "Waiting for teacher..."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Participants Grid (if more than 2) */}
          {Object.keys(remoteTracks).filter((key) => key.includes("-video"))
            .length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {Object.keys(remoteTracks)
                .filter((key) => key.includes("-video"))
                .slice(1)
                .map((key) => {
                  const uid = key.split("-")[0];
                  return (
                    <div
                      key={uid}
                      className="relative bg-gray-800 rounded-lg overflow-hidden shadow-xl"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <div id={`player-${uid}`} className="w-full h-full" />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm">
                        Participant {uid}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-800 to-transparent border-t border-gray-700 px-6 py-6 backdrop-blur-sm">
        <div className="flex justify-center items-center space-x-3">
          {/* Microphone Control */}
          {localTracks.audioTrack && (
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              } text-white transition-all duration-200 shadow-lg transform hover:scale-105`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Camera Control */}
          {localTracks.videoTrack && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full ${
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              } text-white transition-all duration-200 shadow-lg transform hover:scale-105`}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13.828V6.172a2 2 0 00-2.828-1.828l-1.642.82A2 2 0 0012 4H6.414l-2.121-2.121a1 1 0 00-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              )}
            </button>
          )}

          {/* Enable Camera Button - For students who haven't enabled yet */}
          {!isTeacher && !localTracks.videoTrack && (
            <button
              onClick={enableLocalMedia}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center space-x-2 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span>Enable Camera</span>
            </button>
          )}

          {/* Leave Button */}
          <button
            onClick={leaveClass}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>Leave</span>
          </button>

          {/* End Class Button - Teacher only */}
          {isTeacher && (
            <button
              onClick={endClass}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all duration-200 shadow-lg transform hover:scale-105 font-medium"
            >
              End Class
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
