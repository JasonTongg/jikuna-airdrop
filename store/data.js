import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Initial state
const initialState = {
	littleOriginPoint: 0,
	jikunaPoint: 0,
};

const datas = createSlice({
	name: "Datas",
	initialState,
	reducers: {
		setLittleOriginPoint: (state, action) => {
			state.littleOriginPoint = action.payload;
		},
		setJikunaPoint: (state, action) => {
			state.jikunaPoint = action.payload;
		},
	},
});

// Export the reducer
export default datas.reducer;
export const { setLittleOriginPoint, setJikunaPoint } = datas.actions;
