
nums=list(map(int,input().split()))
target=int(input())
nums.sort()
nums_2 = []
for i, num in enumerate(nums):
        nums_2.append(num)
        nums = nums_2
        results = set()

        for i in range(len(nums) - 3):
            for j in range(i + 1, len(nums) - 2):
                num = nums[i] + nums[j]
                if num > target / 2:
                    break
                left = j + 1
                right = len(nums) - 1

                while left < right:
                    sum_ = nums[left] + nums[right]

                    if sum_ == target - num:
                        results.add((nums[i], nums[j], nums[left], nums[right]))
                        left += 1
                    elif sum_ > target - num:
                        right -= 1
                    else:
                        left += 1
        
print(list(results))