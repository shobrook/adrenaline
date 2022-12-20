def apply_func_to_input(func, input):
	func(input)

def main():
	my_data = []
	for i in range(10):
		apply_func_to_input(my_data.append, i)

	print(my_data)

main()
