import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import instance from "@/lib/axios.instance";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { setAuthUser } from "@/redux/authSlice";
import { toast } from "sonner";

const EditProfile = () => {
  const imageRef = useRef();
  const { user } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");
  const [input, setInput] = useState({
    profilePicture: user?.profilePicture,
    bio: user?.bio,
    gender: user?.gender,
    username: user?.username,
    name: user?.name,
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fileChangeHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput({ ...input, profilePicture: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const selectChangeHandler = (value) => {
    setInput({ ...input, gender: value });
  };

  const editProfileHandler = async () => {
    const formdata = new FormData();
    formdata.append("bio", input.bio);
    formdata.append("gender", input.gender);
    formdata.append("username", input.username);
    formdata.append("name", input.name);
    if (input.profilePicture) {
      formdata.append("profilePhoto", input.profilePicture);
    }
    try {
      setLoading(true);
      const res = await instance.post("/user/profile-edit", formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        const updatedUserData = {
          ...user,
          bio: res?.data?.user?.bio,
          profilePicture: res?.data?.user?.profilePicture,
          gender: res?.data?.user?.gender,
          username: res?.data?.user?.username,
          name: res?.data?.user?.name,
        };
        dispatch(setAuthUser(updatedUserData));
        navigate(`/profile/${user?._id}`);
        toast.success(res?.data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-2xl mx-auto px-4 md:px-10">
      <section className="flex flex-col gap-6 w-full my-8">
        <h1 className="font-bold text-xl"></h1>
        <div className="flex items-center justify-between bg-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                className={"object-cover"}
                src={preview || user?.profilePicture}
              />
              <AvatarFallback>
                {(user?.name || user?.username)?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-3">
              <h1 className="font-bold text-sm"> {user?.username} </h1>
              <span className="text-gray-600 text-sm">
                {user?.bio || "bio here...."}
              </span>
            </div>
          </div>
          <input
            onChange={fileChangeHandler}
            ref={imageRef}
            type="file"
            className="hidden"
          />
          <Button
            onClick={() => imageRef?.current.click()}
            className={"bg-[#0095F6] h-8 hover:bg-[#016bb1]"}
          >
            Change photo
          </Button>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
          <h1 className="font-bold text-base mb-2">Username</h1>
          <input
            type="text"
            value={input.username}
            onChange={(e) => setInput({ ...input, username: e.target.value })}
            className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-[#0095F6] transition-colors pb-1"
          />
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
          <h1 className="font-bold text-base mb-2">Name</h1>
          <input
            type="text"
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
            className="w-full bg-transparent outline-none border-b border-gray-300 focus:border-[#0095F6] transition-colors pb-1"
          />
        </div>
        <div>
          <h1 className="font-bold text-base mb-2">Bio</h1>
          <Textarea
            value={input.bio}
            name="bio"
            onChange={(e) => setInput({ ...input, bio: e.target.value })}
            className={" focus-visible:ring-transparent"}
          />
        </div>
        <div>
          <h1 className="font-bold mb-2">Gender</h1>
          <Select
            defaultValue={input.gender}
            onValueChange={selectChangeHandler}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          {loading ? (
            <Button className={"w-fit bg-[#0095F6] hover:bg-[#016bb1]"}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </Button>
          ) : (
            <Button
              onClick={editProfileHandler}
              className={"w-fit bg-[#0095F6] hover:bg-[#016bb1]"}
            >
              Submit
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default EditProfile;
